import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { AppbarService } from '../shared/appbar.service';
import { BoardService } from '../shared/board/board.service';
import { Board } from '../shared/board/board.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BoardNotFoundError, UserNotPartOfThisBoardError } from '../shared/board/board.error';
import { defaultSnackbarConfig } from '../shared/snackbar-config';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from './create-board-dialog/create-board-dialog.component';
import { take } from 'rxjs';
import { UnexpectedApiError } from '../shared/general.error';

@Component({
  selector: 'board-selection',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './board-selection.component.html',
  styleUrl: './board-selection.component.scss',
})
export class BoardSelectionComponent implements OnInit {
  public boards: WritableSignal<Board[]> = signal([]);

  constructor(
    private appbarService: AppbarService,
    private authService: AuthService,
    private boardService: BoardService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.appbarService.updateTitle('Boardauswahl');
    this.appbarService.setActions([
      {
        icon: 'refresh',
        action: this.updateBoardsWithUser.bind(this),
      },
    ]);
  }

  ngOnInit(): void {
    this.updateBoardsWithUser();
  }

  public async updateBoardsWithUser(): Promise<void> {
    try {
      this.boards.set(await this.boardService.getBoardsWithUser());
    } catch (e) {
      if (e instanceof UnexpectedApiError) {
        this.snackBar.open('Boards konnten nicht aktualisiert werden', 'Ok', defaultSnackbarConfig());
      }
      this.boards.set([]);
    }
  }

  public async enterBoard(boardId: string): Promise<void> {
    try {
      const board = await this.boardService.getBoardById(boardId);
      const userId = this.authService.user()?.id;
      if (!userId) {
        this.snackBar.open('Nicht eingeloggt', 'Ok', defaultSnackbarConfig());
        return;
      }
      if (board.allowedMembers.includes(userId)) {
        this.boardService.joinBoard(board, userId);
        this.router.navigate(['board', board._id]);
      } else {
        this.snackBar.open('User ist kein Teil von diesem Board', 'Ok', defaultSnackbarConfig());
      }
    } catch (e) {
      let message: string;
      if (e instanceof BoardNotFoundError) {
        message = e.message;
      } else if (e instanceof UserNotPartOfThisBoardError) {
        message = e.message;
      } else {
        message = 'Board konnte nicht betreten werden';
      }
      this.snackBar.open(message, 'Ok', defaultSnackbarConfig());
    }
  }

  public createBoard(): void {
    const dialogRef = this.dialog.open<CreateBoardDialogComponent>(CreateBoardDialogComponent);
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(async (name) => {
        if (name) {
          await this.boardService.createBoard(name);
          this.updateBoardsWithUser();
        }
      });
  }
}
