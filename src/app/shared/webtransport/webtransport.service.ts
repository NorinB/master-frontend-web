import { Injectable } from '@angular/core';
import { WebTransportClient } from 'wasm-webtransport';
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
  private client: WebTransportClient | null = null;

  constructor(private snackBar: MatSnackBar) {}

  public async initSession(): Promise<void> {
    if (!(await this.isClosed())) {
      await this.closeConnection();
    }
    this.client = new WebTransportClient(this.webTransportUrl, this.webTransportCertificate);
    await this.client.init_session();
  }

  public async isClosed(): Promise<boolean> {
    return !this.client || (await this.client.is_closed());
  }

  public async closeConnection(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.close();
    this.client = null;
  }

  private async checkClientIsActive(): Promise<void> {
    if (!this.client) {
      throw new WebTransportNotInitializedError();
    }
    if (await this.client.is_closed()) {
      this.client = null;
      throw new WebTransportConnectionIsClosedError();
    }
  }

  public async connectToContext(eventCategory: string, contextId: string, callback: (message: string) => void, contextObject): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.connect_to_context(eventCategory, contextId, callback, contextObject);
    } catch (e) {
      const error = e as Error;
      this.client = null;
      this.snackBar.open(error.message, 'Ok', defaultSnackbarConfig());
      throw new WebTransportConnectionIsClosedError();
    }
  }

  public async sendClientMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_client_message(message);
    } catch (e) {
      this.client = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendBoardMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_board_message(message);
    } catch (e) {
      this.client = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendElementMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_element_message(message);
    } catch (e) {
      this.client = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendActiveMemberMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_active_member_message(message);
    } catch (e) {
      this.client = null;
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }
}
