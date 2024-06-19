import { Injectable, Signal, WritableSignal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import {
  InvalidStoredCredentialsError,
  NotLoggedInError,
  UnauthorizedError,
  UserAlreadyExistsError,
  UserNameInvalidError,
  UserNotFoundError,
} from './auth.error';
import { UnexpectedApiError } from '../shared/error';
import { LoggedInUser, DeviceType, mapDeviceTypeToString } from './auth.models';
import { v4 as uuidv4 } from 'uuid';
import { Observable, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiBaseUrl = environment.apiBaseUrl;
  private _user: WritableSignal<LoggedInUser | null> = signal(null);
  public get user(): Signal<LoggedInUser | null> {
    return this._user.asReadonly();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.setupLoggedInUser();
  }

  public async setupLoggedInUser(): Promise<void> {
    const storedUser = this.getValidStoredUser();
    if (!storedUser) {
      return;
    }
    this.http.get<{ clientId: string }>(`${this.apiBaseUrl}/client/${storedUser.id}`, { observe: 'response' }).subscribe(
      (response) => {
        if (response!.body!.clientId === storedUser.clientId) {
          this._user.set({
            clientId: storedUser.clientId,
            email: storedUser.email,
            name: storedUser.name,
            id: storedUser.id,
            deviceType: storedUser.deviceType,
          });
        } else {
          localStorage.removeItem('user');
          this._user.set(null);
          this.router.navigate(['auth']);
        }
      },
      (error) => {
        localStorage.removeItem('user');
        this._user.set(null);
        this.router.navigate(['auth']);
      },
    );
  }

  public clientIsLoggedIn(userId: string, clientId: string): Observable<boolean> {
    return this.http.get(`${this.apiBaseUrl}/client/${userId}`, { observe: 'response' }).pipe(
      switchMap((response) => {
        if (!response) {
          return of(false);
        }
        switch (response.status) {
          case StatusCodes.OK:
            return of(response.body!['clientId'] === clientId);
          default: {
            return of(false);
          }
        }
      }),
    );
  }

  public getValidStoredUser(): LoggedInUser | null {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return null;
    }
    const storedClientJson = JSON.parse(storedUser);
    if (!storedClientJson || !storedClientJson.id || !storedClientJson.clientId) {
      throw new InvalidStoredCredentialsError();
    }
    return storedClientJson;
  }

  public async login(email: string | null, name: string | null, password: string): Promise<void> {
    const storedUserJson = this.getValidStoredUser();
    if (storedUserJson) {
      try {
        const getClientResponse = await this.http.get(`${this.apiBaseUrl}/client/${storedUserJson.id}`, { observe: 'response' }).toPromise();
        if (getClientResponse!.body!['userId'] === storedUserJson.id && getClientResponse!.body!['clientId'] === storedUserJson.clientId) {
          return;
        }
      } catch (e) {
        let errorResponse = e as HttpErrorResponse;
        if (errorResponse.status === StatusCodes.INTERNAL_SERVER_ERROR) {
          throw new UnexpectedApiError();
        }
      }
    }
    const clientId = uuidv4();
    try {
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
      this._user.set({
        email: loginResponse!.body!.email,
        name: loginResponse!.body!.name,
        id: loginResponse!.body!.userId,
        deviceType: DeviceType.Web,
        clientId: clientId,
      });
      localStorage.setItem(
        'user',
        JSON.stringify({ id: loginResponse!.body!.userId, clientId: clientId, name: loginResponse!.body!.name, email: loginResponse!.body!.email }),
      );
      return;
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.UNAUTHORIZED:
          throw new UnauthorizedError();
        case StatusCodes.NOT_FOUND:
          throw new UserNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async register(email: string, name: string, password: string): Promise<void> {
    try {
      await this.http
        .post<{
          email: string;
          name: string;
          password: string;
        }>(`${this.apiBaseUrl}/register`, { email: email, name: name, password: password }, { observe: 'response' })
        .toPromise();
      localStorage.removeItem('user');
      await this.login(email, null, password);
    } catch (e) {
      const errorReponse = e as HttpErrorResponse;
      switch (errorReponse.status) {
        case StatusCodes.CONFLICT:
          throw new UserAlreadyExistsError();
        case StatusCodes.BAD_REQUEST:
          throw new UserNameInvalidError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async logout(): Promise<void> {
    const storedUserJson = this.getValidStoredUser();
    if (!storedUserJson) {
      throw new NotLoggedInError();
    }
    console.log(storedUserJson.id);
    try {
      await this.http.delete(`${this.apiBaseUrl}/logout/${storedUserJson.id}`, { observe: 'response' }).toPromise();
      localStorage.removeItem('user');
      this._user.set(null);
      this.router.navigate(['auth']);
    } catch (e) {
      console.log(e);
      throw new UnexpectedApiError();
    }
  }
}
