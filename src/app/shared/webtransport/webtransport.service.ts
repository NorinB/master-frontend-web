import { Injectable } from '@angular/core';
import { WebTransportClient } from 'wasm-webtransport';
import { environment } from '../../../environments/environment';
import { WebTransportConnectionHasBeenClosedError, WebTransportConnectionIsClosedError, WebTransportNotInitializedError } from './webtransport.error';

@Injectable({
  providedIn: 'root',
})
export class WebTransportService {
  private webTransportUrl = environment.webTransportUrl;
  private webTransportCertificate = environment.webTransportCertificate;
  private client: WebTransportClient | null = null;

  constructor() {}

  public async initSession(): Promise<void> {
    console.log('webTransportUrl: ', this.webTransportUrl);
    console.log('webTransportCertificate: ', this.webTransportCertificate);
    this.client = new WebTransportClient(this.webTransportUrl, this.webTransportCertificate);
    await this.client.init_session();
  }

  private async checkClientIsActive(): Promise<void> {
    if (!this.client) {
      throw new WebTransportNotInitializedError();
    }
    if (await this.client.is_closed()) {
      throw new WebTransportConnectionIsClosedError();
    }
  }

  public async connectToContext(eventCategory: string, contextId: string, callback: (message: string) => void, contextObject): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.connect_to_context(eventCategory, contextId, callback, contextObject);
    } catch (e) {
      throw new WebTransportConnectionIsClosedError();
    }
  }

  public async sendClientMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_client_message(message);
    } catch (e) {
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendBoardMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_board_message(message);
    } catch (e) {
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendElementMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_element_message(message);
    } catch (e) {
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }

  public async sendActiveMemberMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    const client = this.client!;
    try {
      await client.send_active_member_message(message);
    } catch (e) {
      throw new WebTransportConnectionHasBeenClosedError();
    }
  }
}
