import { Injectable, WritableSignal, signal } from '@angular/core';
import { Board } from './board.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { StatusCodes } from 'http-status-codes';
import { BoardNotFoundError, UserNotPartOfThisBoardError } from './board.error';
import { ActiveMember } from '../active-member/active-member.model';
import { NotLoggedInError } from '../auth/auth.error';
import { UnexpectedApiError } from '../general.error';
import { Observable, from, of, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiBaseUrl = environment.apiBaseUrl;
  private activeBoard: WritableSignal<Board | null> = signal(null);
  private activeMember: WritableSignal<ActiveMember | null> = signal(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  public setActiveBoard(board: Board | null): void {
    this.activeBoard.set(board);
  }

  public async getBoardsWithUser(): Promise<Board[]> {
    try {
      const response = await this.http.get(`${this.apiBaseUrl}/boards/${this.authService.user()!.id}`, { observe: 'response' }).toPromise();
      console.log(response!.body);
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

  public async getBoardById(boardId: string): Promise<Board> {
    try {
      return (await this.http.get<Board>(`${this.apiBaseUrl}/board/${boardId}`, { observe: 'response' }).toPromise())!.body!;
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new BoardNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async joinBoard(board: Board, userId: string): Promise<void> {
    try {
      this.activeMember.set(
        (await this.http.post<any>(`${this.apiBaseUrl}/active-member`, { userId: userId, boardId: board._id }, { observe: 'response' }).toPromise())!.body!,
      );
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.FORBIDDEN:
          throw new UserNotPartOfThisBoardError();
        case StatusCodes.NOT_FOUND:
          throw new BoardNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async createBoard(name: string): Promise<void> {
    if (!this.authService.user()) {
      throw new NotLoggedInError();
    }
    try {
      await this.http.post<any>(`${this.apiBaseUrl}/board`, { name: name, host: this.authService.user()!.id }).toPromise();
    } catch (e) {
      throw new UnexpectedApiError();
    }
  }

  public userIsPartOfBoard(boardId: string): Observable<boolean> {
    if (!this.authService.user()) {
      throw new NotLoggedInError();
    }
    return from(this.getBoardById(boardId)).pipe(
      take(1),
      switchMap((board) => of(board.allowedMembers.includes(this.authService.user()!.id))),
    );
  }
}
