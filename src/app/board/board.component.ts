import { Component, OnInit } from '@angular/core';
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
import { initWasm, init_webtransport } from 'wasm-webtransport';
import { Location } from '@angular/common';

@Component({
  selector: 'board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  constructor(
    private appbarService: AppbarService,
    public boardService: BoardService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private location: Location,
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
    this.appbarService.setBackAction(() => {
      this.location.back();
    });
  }

  ngOnInit(): void {
    let url = 'https://[::1]:3031';
    const certificate = new Uint8Array([
      139, 209, 60, 49, 254, 89, 124, 26, 18, 153, 140, 188, 43, 245, 4, 48, 241, 223, 6, 24, 8, 114, 22, 121, 172, 44, 146, 8, 37, 94, 214, 92,
    ]);
    const eventCategory = 'board';
    const contextId = '667362d829a107b93fcd9639';
    this.initWasm(url, certificate, eventCategory, contextId);
    // this.testWebTransport(url, certificate, eventCategory, contextId);
  }

  async testWebTransport(url: string, certificate: Uint8Array, eventCategory: string, contextId: string) {
    // Create a WebTransport instance connecting to the Rust server
    const certificateArray = certificate;
    console.log('Starte WebTransport...');
    let transport = new WebTransport(url, {
      serverCertificateHashes: [{ algorithm: 'sha-256', value: certificateArray.buffer }],
    });
    await transport.ready;

    // Create a bidirectional stream
    const stream = await transport.createBidirectionalStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const initMessage = {
      messageType: 'init',
      eventCategory: eventCategory,
      contextId: contextId,
    };

    console.log('Event Category: ', initMessage.eventCategory);
    console.log('init with contextId: ', initMessage.contextId);
    await writer.write(new TextEncoder().encode(JSON.stringify(initMessage)));

    console.log('Warte auf Init Message');
    let data = await reader.read();
    console.log(new TextDecoder().decode(data.value));

    console.log('Warte auf Async Message');
    for (let i = 0; i < 2; i++) {
      data = await reader.read();
      console.log(new TextDecoder().decode(data.value));
    }

    transport.close();
  }

  async initWasm(url: string, certificate: Uint8Array, eventCategory: string, contextId: string): Promise<void> {
    await initWasm();
    init_webtransport(url, certificate, eventCategory, contextId);
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
