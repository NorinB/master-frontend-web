import { Injectable } from '@angular/core';
import { WebTransportClient, WebTransportSendStream } from 'wasm-webtransport';
import { environment } from '../../../environments/environment';
import { WebTransportConnectionHasBeenClosedError, WebTransportConnectionIsClosedError, WebTransportNotInitializedError } from './webtransport.error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { defaultSnackbarConfig } from '../snackbar-config';

@Injectable({
  providedIn: 'root',
})
export class WebTransportService {
  private webTransportUrl = environment.webTransportUrl;
  private webTransportCertificate = environment.webTransportCertificate;
  private webTransportClient: WebTransportClient | null = null;
  private boardSendStream: WebTransportSendStream | null = null;
  private elementSendStream: WebTransportSendStream | null = null;
  private activeMemberSendStream: WebTransportSendStream | null = null;
  private clientSendStream: WebTransportSendStream | null = null;

  constructor(private snackBar: MatSnackBar) {}

  public async initSession(): Promise<void> {
    if (!(await this.isClosed())) {
      await this.closeConnection();
    }
    this.webTransportClient = new WebTransportClient(this.webTransportUrl, this.webTransportCertificate);
    await this.webTransportClient.init_session();
  }

  public async setupConnections(boardId: string, userId: string): Promise<void> {
    this.boardSendStream = await this.webTransportClient!.setup_connection('board', boardId);
    this.elementSendStream = await this.webTransportClient!.setup_connection('element', boardId);
    this.activeMemberSendStream = await this.webTransportClient!.setup_connection('active_member', boardId);
    this.clientSendStream = await this.webTransportClient!.setup_connection('client', userId);
  }

  public async isClosed(): Promise<boolean> {
    return !this.webTransportClient || (await this.webTransportClient.is_closed());
  }

  public async closeConnection(): Promise<void> {
    if (!this.webTransportClient) {
      return;
    }
    console.log('Jetzt Webtransport schliessen');
    await this.webTransportClient.close();
    this.webTransportClient = null;
  }

  private async checkClientIsActive(): Promise<void> {
    if (!this.webTransportClient) {
      throw new WebTransportNotInitializedError();
    }
    // if (await this.client.is_closed()) {
    //   this.client = null;
    //   throw new WebTransportConnectionIsClosedError();
    // }
  }

  public async connectToContext(
    boardCallback: (message: string) => void,
    elementCallback: (message: string) => void,
    activeMemberCallback: (message: string) => void,
    clientCallback: (message: string) => void,
    contextObject,
  ): Promise<void> {
    await this.checkClientIsActive();
    const client = this.webTransportClient!;
    try {
      await client.connect_to_context(boardCallback, elementCallback, activeMemberCallback, clientCallback, contextObject);
    } catch (e) {
      const error = e as Error;
      this.webTransportClient = null;
      this.snackBar.open(error.message, 'Ok', defaultSnackbarConfig());
      throw new WebTransportConnectionIsClosedError();
    }
  }

  public async sendClientMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    if (!this.clientSendStream) {
      throw new WebTransportConnectionIsClosedError();
    }
    try {
      await this.clientSendStream!.send_message(message);
    } catch (e) {
      this.webTransportClient = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendBoardMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    if (!this.boardSendStream) {
      throw new WebTransportConnectionIsClosedError();
    }
    try {
      await this.boardSendStream.send_message(message);
    } catch (e) {
      this.webTransportClient = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendElementMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    if (!this.elementSendStream) {
      throw new WebTransportConnectionIsClosedError();
    }
    try {
      await this.elementSendStream.send_message(message);
    } catch (e) {
      this.webTransportClient = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendActiveMemberMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    if (!this.activeMemberSendStream) {
      throw new WebTransportConnectionIsClosedError();
    }
    try {
      await this.activeMemberSendStream.send_message(message);
    } catch (e) {
      this.webTransportClient = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }
}
