import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { Location } from '@angular/common';
import { WebTransportService } from '../shared/webtransport/webtransport.service';
import { AuthService } from '../shared/auth/auth.service';
import { ElementService } from '../shared/element/element.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'board',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') private canvasElement: ElementRef<HTMLCanvasElement>;

  constructor(
    private appbarService: AppbarService,
    // @ts-ignore
    private authService: AuthService,
    public boardService: BoardService,
    public elementService: ElementService,
    private userService: UserService,
    private webTransportService: WebTransportService,
    private snackBar: MatSnackBar,
    private location: Location,
    private dialog: MatDialog,
  ) {
    this.appbarService.updateTitle('Board');
    this.appbarService.setActions([
      {
        icon: 'refresh',
        action: async () => {
          this.initWebTransport();
        },
      },
      {
        icon: 'person_add',
        action: this.openAddMemberDialog.bind(this),
      },
    ]);
    this.appbarService.setBackAction(() => {
      this.location.back();
    });
  }

  ngOnInit(): void {
    this.initWebTransport();
    this.initCreatableElements();
  }

  ngAfterViewInit(): void {
    this.elementService.setupCanvas(this.canvasElement.nativeElement);
  }

  private async initCreatableElements(): Promise<void> {
    await this.elementService.getCreatableElements();
  }

  async initWebTransport(): Promise<void> {
    try {
      await this.webTransportService.initSession(this.boardService.activeBoard()!._id, this.authService.user()!.id);
      await this.webTransportService.connectToContext(
        (boardEvent) => {
          try {
            const jsonMessage = JSON.parse(boardEvent);
            switch (jsonMessage.messageType) {
              case 'board_memberadded':
                break;
              case 'board_memberremoved':
                break;
              default: {
                console.error('Board Event unknown');
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        (elementEvent) => {
          try {
            // TODO: hier noch handeln, wenn eine doppelte Nachricht kommt, dass die Nachrichten getrennt werden
            const jsonMessage = JSON.parse(elementEvent);
            const messageBody = JSON.parse(jsonMessage.body);
            if (messageBody.userId === this.authService.user()!.id) {
              return;
            }
            switch (jsonMessage.messageType) {
              case 'element_created':
                this.elementService.createElementByEvent(messageBody);
                break;
              case 'element_removed':
                this.elementService.removeElementByEvent(messageBody);
                break;
              case 'element_moved':
                break;
              case 'element_locked':
                break;
              case 'element_unlocked':
                break;
              case 'element_updated':
                break;
              default: {
                console.error('Element Event unknown');
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        (activeMemberEvent) => {
          try {
            const jsonMessage = JSON.parse(activeMemberEvent);
            switch (jsonMessage.messageType) {
              case 'activemember_created':
                break;
              case 'activemember_removed':
                break;
              case 'activemember_positionupdated':
                break;
              default: {
                console.error('Active Member Event unknown');
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        (clientEvent) => {
          try {
            const jsonMessage = JSON.parse(clientEvent);
            switch (jsonMessage) {
              case 'client_removed':
                break;
              case 'client_changed':
                break;
              default: {
                console.error('Client Event unknown');
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        this,
      );
    } catch (e) {
      this.snackBar.open('WebTransport closed', 'Ok', defaultSnackbarConfig());
    }
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

  public async createElement(elementName: string): Promise<void> {
    await this.elementService.createElementByUser(elementName);
  }

  @HostListener('window:resize', ['$event'])
  public handleWindowResize(event) {
    this.elementService.handleWindowResize(event);
  }

  @HostListener('body:keydown', ['$event'])
  public async handleCanvasKeydown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Backspace') {
      this.elementService.removeSelectionFromCanvas();
    }
  }
}
