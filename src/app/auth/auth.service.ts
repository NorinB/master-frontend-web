import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { UnauthorizedError, UserAlreadyExistsError, UserNotFoundError } from './auth.error';
import { UnexpectedApiError } from '../shared/error';
import { User } from './models/user.model';
import { Client } from './models/client.model';
import { v4 as uuidv4 } from 'uuid';
import { DeviceType, mapDeviceTypeToString } from './models/device-type.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiBaseUrl = environment.apiBaseUrl;
  private _user: User | null = null;
  public get user(): User | null {
    return this._user;
  }
  private _client: Client | null = null;
  public get client(): Client | null {
    return this._client;
  }

  constructor(private http: HttpClient) {}

  public async login(email: string | null, name: string | null, password: string): Promise<void> {
    const storedClient = localStorage.getItem('client');
    if (storedClient) {
      const storedClientJson = JSON.parse(storedClient);
      const getClientResponse = await this.http.get(`${this.apiBaseUrl}/client/${storedClientJson.userId}`, { observe: 'response' }).toPromise();
      if (!getClientResponse) {
        throw new UnexpectedApiError();
      }
      switch (getClientResponse!.status) {
        case StatusCodes.OK:
          if (getClientResponse.body!['userId'] === storedClientJson.userId && getClientResponse.body!['clientId'] === storedClientJson?.clientId) {
            return;
          }
          break;
        case StatusCodes.NOT_FOUND:
          throw new UserNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
    const clientId = uuidv4();
    const loginResponse = await this.http
      .post<{
        email: string;
        name: string;
        userId: string;
      }>(
        `${this.apiBaseUrl}/login`,
        { email: email, name: name, password: password, clientId: clientId, deviceType: mapDeviceTypeToString(DeviceType.Web) },
        { observe: 'response' },
      )
      .toPromise();
    if (!loginResponse) {
      throw new UnexpectedApiError();
    }
    switch (loginResponse!.status) {
      case StatusCodes.OK:
        this._user = { email: loginResponse.body!.email, name: loginResponse.body!.name, id: loginResponse.body!.userId };
        this._client = { userId: loginResponse.body!.userId, deviceType: DeviceType.Web, clientId: clientId };
        localStorage.setItem('client', JSON.stringify({ userId: this._client.userId, clientId: this._client.clientId }));
        return;
      case StatusCodes.UNAUTHORIZED:
        throw new UnauthorizedError();
      case StatusCodes.CONFLICT:
        throw new UserAlreadyExistsError();
      default: {
        throw new UnexpectedApiError();
      }
    }
  }

  // TODO: registration
}
