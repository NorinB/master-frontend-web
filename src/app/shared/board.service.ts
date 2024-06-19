import { Injectable } from '@angular/core';
import { Board } from './models/board.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { StatusCodes } from 'http-status-codes';
import { UnexpectedApiError } from './error';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  public async getBoardsWithUser(): Promise<Board[]> {
    try {
      const response = await this.http.get(`${this.apiBaseUrl}/boards/${this.authService.user()!.id}`, { observe: 'response' }).toPromise();
      return response!.body as Board[];
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          return [];
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }
}
