import { Component } from '@angular/core';
import { AppbarService } from '../shared/appbar.service';
import { BoardService } from '../shared/board/board.service';
import { UserService } from '../shared/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserNotFoundError } from '../shared/auth/auth.error';
import { defaultSnackbarConfig } from '../shared/snackbar-config';
import { User } from '../shared/user/user.model';
import { BoardNotFoundError, NotInABoardCurrentlyError, UserAlreadyPartOfThisBoardError, UserNotPartOfThisBoardError } from '../shared/board/board.error';
import { MatDialog } from '@angular/material/dialog';
import { MemberAddDialogComponent } from './member-add-dialog/member-add-dialog.component';
import { take } from 'rxjs';

@Component({
  selector: 'board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  constructor(
    private appbarService: AppbarService,
    public boardService: BoardService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    this.appbarService.updateTitle('Board');
    this.appbarService.setActions([
      {
        icon: 'refresh',
        // TODO: hier noch Connections erneuern
        action: () => {},
      },
      {
        icon: 'person_add',
        action: this.openAddMemberDialog.bind(this),
      },
    ]);
  }

  private async addMember(nameOrEmail: string): Promise<void> {
    let user: User;
    try {
      user = await this.userService.getUserByNameOrEmail(nameOrEmail);
    } catch (e) {
      let message: string;
      if (e instanceof UserNotFoundError) {
        message = e.message;
      } else {
        message = 'User konnte nicht abgefragt werden';
      }
      this.snackBar.open(message, 'Ok', defaultSnackbarConfig());
      return;
    }
    try {
      await this.boardService.addMember(user._id);
      this.snackBar.open(`${user.name} hinzugefügt 🎉`);
    } catch (e) {
      let message: string;
      if (e instanceof BoardNotFoundError || e instanceof UserAlreadyPartOfThisBoardError || e instanceof NotInABoardCurrentlyError) {
        message = e.message;
      } else {
        message = 'User konnte nicht geadded werden';
      }
      this.snackBar.open(message, 'Ok', defaultSnackbarConfig());
    }
  }

  public async removeMember(userId: string): Promise<void> {
    let user: User;
    try {
      user = await this.userService.getUserById(userId);
    } catch (e) {
      let message: string;
      if (e instanceof UserNotFoundError) {
        message = e.message;
      } else {
        message = 'User konnte nicht abgefragt werden';
      }
      this.snackBar.open(message, undefined, defaultSnackbarConfig());
      return;
    }
    try {
      await this.boardService.removeMember(userId);
      this.snackBar.open(`${user.name} entfernt 👋`);
    } catch (e) {
      let message: string;
      if (e instanceof BoardNotFoundError || e instanceof UserNotPartOfThisBoardError || e instanceof NotInABoardCurrentlyError) {
        message = e.message;
      } else {
        message = 'User konnte nicht entfernt werden';
      }
      this.snackBar.open(message, 'Ok', defaultSnackbarConfig());
    }
  }

  public openAddMemberDialog(): void {
    const dialogRef = this.dialog.open<MemberAddDialogComponent>(MemberAddDialogComponent);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(async (nameOrEmail) => {
        if (nameOrEmail) {
          await this.addMember(nameOrEmail);
        }
      });
  }
}
