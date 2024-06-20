import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from './user.model';
import { environment } from '../../../environments/environment';
import { StatusCodes } from 'http-status-codes';
import { UserNotFoundError } from '../auth/auth.error';
import { UnexpectedApiError } from '../general.error';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.http.get(`${this.apiBaseUrl}/user/${userId}`).toPromise();
      return response! as User;
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new UserNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async getUserByNameOrEmail(nameOrEmail: string): Promise<User> {
    let isEmail = false;
    if (nameOrEmail.includes('@')) {
      isEmail = true;
    }
    try {
      let url: string = `${this.apiBaseUrl}/user`;
      if (isEmail) {
        url += `?email=${nameOrEmail}`;
      } else {
        url += `?name=${nameOrEmail}`;
      }
      const foundUsers = (await this.http.get<User[]>(url, { observe: 'response' }).toPromise())!.body!;
      if (foundUsers.length !== 1) {
        throw new UserNotFoundError();
      }
      return foundUsers[0];
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new UserNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }
}
