import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
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
import { Router } from '@angular/router';
import { ActiveMemberService } from '../shared/active-member/active-member.service';
import { CanvasService } from '../shared/canvas/canvas.service';

@Component({
  selector: 'board',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasElement: ElementRef<HTMLCanvasElement>;

  constructor(
    private appbarService: AppbarService,
    // @ts-ignore
    private authService: AuthService,
    public boardService: BoardService,
    private canvasService: CanvasService,
    public elementService: ElementService,
    private activeMemberService: ActiveMemberService,
    private userService: UserService,
    private webTransportService: WebTransportService,
    private snackBar: MatSnackBar,
    private location: Location,
    private dialog: MatDialog,
    private router: Router,
  ) {
    this.appbarService.updateTitle('Board');
    this.appbarService.setActions([
      {
        buttonId: 'button-refresh',
        icon: 'refresh',
        action: async () => {
          await this.elementService.loadExistingElements();
          await this.elementService.unlockAllElements();
          await this.activeMemberService.loadExistingActiveMembers();
          this.initWebTransport();
        },
      },
      {
        buttonId: 'button-member-add',
        icon: 'person_add',
        action: this.openAddMemberDialog.bind(this),
      },
      {
        buttonId: 'button-start-sampling',
        icon: 'play_arrow',
        action: this.startMinuteSampling.bind(this),
      },
    ]);
    this.appbarService.setBackAction(() => {
      this.location.back();
    });
  }

  public startMinuteSampling(): void {
    console.log('Starte Sampling von einer Minute in 3 Sekunden...');
    setTimeout(() => {
      this.webTransportService.startMinuteSampling();
    }, 5000);
  }

  ngOnDestroy(): void {
    this.webTransportService.stopSecondSampling();
  }

  ngAfterViewInit(): void {
    this.canvasService.setupCanvas(this.canvasElement.nativeElement);
    this.initCreatableElements();
    this.loadExistingElements();
    this.loadActiveMembers();
    this.activeMemberService.setupCursorSubscription();
    this.initWebTransport();
  }

  private async initCreatableElements(): Promise<void> {
    await this.elementService.getCreatableElements();
  }

  private async loadExistingElements(): Promise<void> {
    await this.elementService.loadExistingElements();
  }

  private async loadActiveMembers(): Promise<void> {
    await this.activeMemberService.loadExistingActiveMembers();
  }

  async initWebTransport(): Promise<void> {
    try {
      await this.webTransportService.initSession(this.boardService.activeBoard()!._id, this.authService.user()!.id);
      this.webTransportService.startSecondSampling();
      await this.webTransportService.connectToContext(
        (boardEvent) => {
          this.webTransportService.increaseSamplingCounter();
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
          this.webTransportService.increaseSamplingCounter();
          try {
            let messages: { messageType: string; status: string; body: string }[];
            try {
              const jsonMessage = JSON.parse(elementEvent);
              messages = [jsonMessage];
            } catch (e) {
              const separatedMessages: string[] = this.extractIndidualMessages(elementEvent);
              messages = separatedMessages.map((message, index) => {
                try {
                  const jsonMessage = JSON.parse(message);
                  return jsonMessage;
                } catch (e) {
                  console.error(message);
                  throw e;
                }
              });
            }
            for (const message of messages) {
              // console.log('New element message: ', message);
              if (message.status === 'ERROR') {
                continue;
              }
              const messageBody = JSON.parse(message.body);
              const messageTypeIsResponse = Array.isArray(message.messageType.match('response'));
              if (!messageTypeIsResponse && messageBody.userId === this.authService.user()!.id) {
                continue;
              }
              switch (message.messageType) {
                case 'response_createelement':
                case 'element_created':
                  this.elementService.createElementByEvent(messageBody);
                  break;
                case 'response_removeelement':
                case 'element_removed':
                  this.elementService.removeElementByEvent(messageBody);
                  break;
                case 'response_moveelements':
                case 'element_moved':
                  if (!messageTypeIsResponse) {
                    this.elementService.moveElementsByEvent(messageBody);
                  }
                  break;
                case 'response_lockelement':
                case 'element_locked':
                  if (!messageTypeIsResponse) {
                    this.elementService.lockElementByEvent(messageBody);
                  }
                  break;
                case 'response_unlockelement':
                case 'element_unlocked':
                  if (!messageTypeIsResponse) {
                    this.elementService.unlockElementByEvent(messageBody);
                  }
                  break;
                case 'response_updateelement':
                case 'element_updated':
                  if (!messageTypeIsResponse) {
                    this.elementService.updateElementByEvent(messageBody);
                  }
                  break;
                default: {
                  console.error('Element Event unknown: ', message.messageType);
                  return;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        (activeMemberEvent) => {
          this.webTransportService.increaseSamplingCounter();
          try {
            let messages: { messageType: string; status: string; body: string }[];
            try {
              const jsonMessage = JSON.parse(activeMemberEvent);
              messages = [jsonMessage];
            } catch (e) {
              const separatedMessages: string[] = this.extractIndidualMessages(activeMemberEvent);
              messages = separatedMessages.map((message, index) => {
                const jsonMessage = JSON.parse(message);
                return jsonMessage;
              });
            }
            for (const message of messages) {
              // console.log('New active member message: ', message);
              if (message.status === 'ERROR') {
                continue;
              }
              const messageBody = JSON.parse(message.body);
              const messageTypeIsResponse = Array.isArray(message.messageType.match('response'));
              if (!messageTypeIsResponse && messageBody.userId === this.authService.user()!.id) {
                continue;
              }
              switch (message.messageType) {
                case 'response_createactivemember':
                case 'activemember_created':
                  if (!messageTypeIsResponse) {
                    this.activeMemberService.addActiveMemberByEvent(messageBody);
                  }
                  break;
                case 'response_removeactivemember':
                case 'activemember_removed':
                  if (!messageTypeIsResponse) {
                    this.activeMemberService.removeActiveMemberByEvent(messageBody);
                  }
                  break;
                case 'response_updateposition':
                case 'activemember_positionupdated':
                  if (!messageTypeIsResponse) {
                    this.activeMemberService.updateActiveMemberPosition(messageBody);
                  }
                  break;
                default: {
                  console.error('Active Member Event unknown: ', message.messageType);
                  return;
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        },
        (clientEvent) => {
          this.webTransportService.increaseSamplingCounter();
          try {
            let messages: { messageType: string; status: string; body: string }[];
            try {
              const jsonMessage = JSON.parse(clientEvent);
              messages = [jsonMessage];
            } catch (e) {
              const separatedMessages: string[] = this.extractIndidualMessages(clientEvent);
              messages = separatedMessages.map((message, index) => {
                const jsonMessage = JSON.parse(message);
                return jsonMessage;
              });
            }
            for (const message of messages) {
              switch (message.messageType) {
                case 'client_removed':
                case 'client_changed':
                  const messageBody = JSON.parse(message.body);
                  if (this.authService.user()?.clientId !== messageBody.clientId) {
                    this.router.navigate(['board-selection']);
                    this.canvasService.dispose();
                    this.webTransportService.closeConnection();
                  }
                  break;
                default: {
                  console.error('Client Event unknown');
                  return;
                }
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
      this.webTransportService.stopSecondSampling();
    }
  }

  private extractIndidualMessages(messagesString: string): string[] {
    if (messagesString.length < 1) {
      return [];
    }
    const objectSeparator = '}{';
    const matchIndex = messagesString.indexOf(objectSeparator);
    if (matchIndex === -1) {
      return [messagesString];
    } else {
      return [messagesString.substring(0, matchIndex + 1), ...this.extractIndidualMessages(messagesString.slice(matchIndex + 1))];
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
      this.snackBar.open(`${user.name} hinzugefügt 🎉`, undefined, defaultSnackbarConfig());
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
      this.snackBar.open(`${user.name} entfernt 👋`, undefined, defaultSnackbarConfig());
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
    this.canvasService.handleWindowResize(event);
  }

  @HostListener('body:keydown', ['$event'])
  public async handleCanvasKeydown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Backspace') {
      this.elementService.removeSelectionFromCanvas();
    }
  }
}
