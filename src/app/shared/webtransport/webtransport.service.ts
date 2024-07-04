import { Injectable } from '@angular/core';
import { WebTransportClient, WebTransportSendStream, WebTransportTransport } from 'wasm-webtransport';
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
  private webTransportTransport: WebTransportTransport | null = null;
  private boardSendStream: WebTransportSendStream | null = null;
  private elementSendStream: WebTransportSendStream | null = null;
  private activeMemberSendStream: WebTransportSendStream | null = null;
  private clientSendStream: WebTransportSendStream | null = null;

  constructor(private snackBar: MatSnackBar) {}

  public async initSession(boardId: string, userId: string): Promise<void> {
    if (!(await this.isClosed())) {
      await this.closeConnection();
    }
    this.webTransportClient = new WebTransportClient(this.webTransportUrl, this.webTransportCertificate);
    await this.webTransportClient.init_session();
    this.boardSendStream = await this.webTransportClient.setup_connection('board', boardId);
    this.elementSendStream = await this.webTransportClient.setup_connection('element', boardId);
    this.activeMemberSendStream = await this.webTransportClient.setup_connection('active_member', boardId);
    this.clientSendStream = await this.webTransportClient.setup_connection('client', userId);
    this.webTransportTransport = await this.webTransportClient.get_transport();
  }

  public async isClosed(): Promise<boolean> {
    return !this.webTransportClient;
  }

  public async closeConnection(): Promise<void> {
    if (!this.webTransportClient) {
      return;
    }
    await this.webTransportTransport?.close();
    this.webTransportClient = null;
    this.webTransportTransport = null;
    this.boardSendStream = null;
    this.elementSendStream = null;
    this.activeMemberSendStream = null;
    this.clientSendStream = null;
  }

  private async checkClientIsActive(): Promise<void> {
    if (!this.webTransportClient) {
      throw new WebTransportNotInitializedError();
    }
    // if (await this.webTransportTransport.is_closed()) {
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
