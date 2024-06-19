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
}
