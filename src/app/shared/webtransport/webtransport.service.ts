import { Injectable } from '@angular/core';
import { WebTransportClient, WebTransportSendStream, WebTransportTransport } from 'wasm-webtransport';
import { environment } from '../../../environments/environment';
import { WebTransportConnectionHasBeenClosedError, WebTransportConnectionIsClosedError, WebTransportNotInitializedError } from './webtransport.error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { defaultSnackbarConfig } from '../snackbar-config';
import { Mutex } from 'async-mutex';
import { Observable, Subscription, interval, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebTransportService {
  private webTransportUrl = environment.webTransportUrl;
  // private webTransportCertificate = environment.webTransportCertificate;
  private webTransportClient: WebTransportClient | null = null;
  private webTransportTransport: WebTransportTransport | null = null;
  private boardSendStream: WebTransportSendStream | null = null;
  private elementSendStream: WebTransportSendStream | null = null;
  private elementSendStreamMutex = new Mutex();
  private activeMemberSendStream: WebTransportSendStream | null = null;
  private activeMemberSendStreamMutex = new Mutex();
  private clientSendStream: WebTransportSendStream | null = null;

  private eventCounter = 0;
  private minuteSamplingIntervalSubject: Observable<number> = interval(60000);
  private minuteSamplingIntervalSubcription: Subscription | null = null;
  private secondSamplingIntervalSubject: Observable<number> = interval(1000);
  private secondSamplingIntervalSubscription: Subscription | null = null;
  private samples: number[] = [];

  public increaseSamplingCounter(): void {
    this.eventCounter++;
  }

  private addToSamples(sample: number): void {
    this.samples.push(sample);
  }

  public startMinuteSampling(): void {
    this.stopMinuteSampling();
    this.samples = [];

    console.log('=================================START SAMPLING=================================');
    this.minuteSamplingIntervalSubcription = this.minuteSamplingIntervalSubject.pipe(take(1)).subscribe(() => {
      const average = this.samples.reduce((prev, current) => prev + current, 0) / this.samples.length;
      console.log(`RESULT: ${average} Events die Sekunde in Zeitspanne einer Minute`);
      console.log(`Events recorded: ${this.samples.length}`);
      console.log('=================================STOP SAMPLING=================================');
      let sampleCSV = 'Events\n';
      this.samples.forEach((sample) => {
        sampleCSV += `${sample}\n`;
      });
      console.log(sampleCSV);
      this.samples = [];
    });
  }

  public stopMinuteSampling(): void {
    if (this.minuteSamplingIntervalSubcription) {
      this.minuteSamplingIntervalSubcription.unsubscribe();
    }
    this.minuteSamplingIntervalSubcription = null;
  }

  public startSecondSampling(): void {
    this.stopSecondSampling();
    this.samples = [];

    this.secondSamplingIntervalSubscription = this.secondSamplingIntervalSubject.subscribe(() => {
      const currentCounter = this.eventCounter;
      console.log('Eventrate: ', currentCounter, ' pro Sekunde. Samplecount: ', this.samples.length);
      this.addToSamples(currentCounter);
      this.eventCounter = 0;
    });
  }

  public stopSecondSampling(): void {
    if (this.secondSamplingIntervalSubscription) {
      this.secondSamplingIntervalSubscription.unsubscribe();
    }

    this.secondSamplingIntervalSubscription = null;
  }

  constructor(private snackBar: MatSnackBar) {}

  public async initSession(boardId: string, userId: string): Promise<void> {
    if (!(await this.isClosed())) {
      await this.closeConnection();
    }
    const certificateBytes = await this.getCertificateBytes();
    const start = new Date();
    this.webTransportClient = new WebTransportClient(this.webTransportUrl, certificateBytes);
    await this.webTransportClient.init_session();
    this.boardSendStream = await this.webTransportClient.setup_connection('board', boardId);
    this.elementSendStream = await this.webTransportClient.setup_connection('element', boardId);
    this.activeMemberSendStream = await this.webTransportClient.setup_connection('active_member', boardId);
    this.clientSendStream = await this.webTransportClient.setup_connection('client', userId);
    const end = new Date();
    console.log('Ellapsed Time for WebTransport: ', end.getMilliseconds() - start.getMilliseconds(), ' ms');
    this.webTransportTransport = await this.webTransportClient.get_transport();
  }

  private getCertificateBytes(): Uint8Array {
    const cert =
      'MIIDvzCCA0WgAwIBAgISA018LqpnDSGM/b6ddlKRgljMMAoGCCqGSM49BAMDMDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJFNTAeFw0yNDA4MTIyMjQ0NTNaFw0yNDExMTAyMjQ0NTJaMCsxKTAnBgNVBAMTIG1hc3Rlci13ZWJ0cmFuc3BvcnQubm9haGJhdWVyLmRlMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEKEhTdheEqAPpSos2SvZTicScuXS+lou8v9E1pHNPW4Zl1ebDtEuMJM+QF4qM2tE18malSkcaHIK688Dg2UALqC2tx191axhxZ9fLeACT8XAtr2KdPpbLrIQHBLfwWkmQo4ICIzCCAh8wDgYDVR0PAQH/BAQDAgeAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSI0cuIoFcHrFfmKyEN20B+xf1h9jAfBgNVHSMEGDAWgBSfK1/PPCFPnQS37SssxMZwi9LXDTBVBggrBgEFBQcBAQRJMEcwIQYIKwYBBQUHMAGGFWh0dHA6Ly9lNS5vLmxlbmNyLm9yZzAiBggrBgEFBQcwAoYWaHR0cDovL2U1LmkubGVuY3Iub3JnLzArBgNVHREEJDAigiBtYXN0ZXItd2VidHJhbnNwb3J0Lm5vYWhiYXVlci5kZTATBgNVHSAEDDAKMAgGBmeBDAECATCCAQUGCisGAQQB1nkCBAIEgfYEgfMA8QB2ABmYEHEJ8NZSLjCA0p4/ZLuDbijM+Q9Sju7fzko/FrTKAAABkUj5nPYAAAQDAEcwRQIhAJB5oQWvmH+FWBMZK7LHcxntgzK1qSdq03t5EtvsetIhAiAeEdBtX4TnRoqOGbcD8wWTnaUeFQDz+Grttq87h3BGUAB3AO7N0GTV2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABkUj5nKwAAAQDAEgwRgIhAMc/bOqjWFXRUIeopv5MMsZAsa4y3+085ZYD1z+nBvIUAiEAt/iFsfE4d7Xp4qKKadSmnxuwHjHSu7z+PhiXuGIPlf0wCgYIKoZIzj0EAwMDaAAwZQIxAPJqs8Qe1L0sLze9YXXyYw2y7luBHFD2tJA3jBQSW8bgAQKl0+oWvIQkIwGCYN//aAIwPqiWWLQWc4nlLpOEKMBqdxdUp4uE3hnEbGOCqdedmhWhSw2Gerjm9JhTRJw0Sxid';
    const pemHeader = '-----BEGIN CERTIFICATE REQUEST-----';
    const pemFooter = '-----END CERTIFICATE REQUEST-----';
    console.log(cert);
    const pem = cert.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    const binaryString = atob(pem);
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('Länge der Bytes: ', bytes.length);
    bytes;
    return environment.webTransportCertificate;
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
    await this.elementSendStreamMutex.runExclusive(async () => {
      try {
        if (!this.elementSendStream) {
          throw new WebTransportConnectionIsClosedError();
        }
        await this.elementSendStream!.send_message(message);
      } catch (e) {
        this.webTransportClient = null;
        throw new WebTransportConnectionHasBeenClosedError();
      }
    });
  }

  public async sendActiveMemberMessage(message: string): Promise<void> {
    await this.checkClientIsActive();
    if (!this.activeMemberSendStream) {
      throw new WebTransportConnectionIsClosedError();
    }
    await this.activeMemberSendStreamMutex.runExclusive(async () => {
      try {
        if (!this.activeMemberSendStream) {
          throw new WebTransportConnectionIsClosedError();
        }
        await this.activeMemberSendStream.send_message(message);
      } catch (e) {
        this.webTransportClient = null;
        throw new WebTransportConnectionHasBeenClosedError();
      }
    });
  }
}
