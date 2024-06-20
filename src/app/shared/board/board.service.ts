import { Injectable, WritableSignal, signal } from '@angular/core';
import { Board } from './board.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { StatusCodes } from 'http-status-codes';
import { BoardNotFoundError, NotInABoardCurrentlyError, UserAlreadyPartOfThisBoardError, UserNotPartOfThisBoardError } from './board.error';
import { ActiveMember } from '../active-member/active-member.model';
import { NotLoggedInError } from '../auth/auth.error';
import { UnexpectedApiError } from '../general.error';
import { Observable, from, of, switchMap, take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { defaultSnackbarConfig } from '../snackbar-config';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiBaseUrl = environment.apiBaseUrl;
  public activeBoard: WritableSignal<Board | null> = signal(null);
  public activeMember: WritableSignal<ActiveMember | null> = signal(null);
  public isHost: WritableSignal<boolean> = signal(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar,
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

  public async checkIfHost(): Promise<void> {
    if (!this.activeBoard() || !this.authService.user()) {
      this.isHost.set(false);
    }
    try {
      const board = await this.getBoardById(this.activeBoard()!._id);
      this.isHost.set(board.host === this.authService.user()?.id);
    } catch (e) {
      this.snackBar.open('Konnte Hoststatus nicht überprüfen', 'Ok', defaultSnackbarConfig());
      this.isHost.set(false);
    }
  }

  public async addMember(userId: string): Promise<void> {
    if (!this.activeBoard()) {
      throw new NotInABoardCurrentlyError();
    }
    try {
      await this.http.put(`${this.apiBaseUrl}/board/${this.activeBoard()!._id}/allowed-member/${userId}`, undefined, { observe: 'response' }).toPromise();
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new BoardNotFoundError();
        case StatusCodes.CONFLICT:
          throw new UserAlreadyPartOfThisBoardError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async removeMember(userId: string): Promise<void> {
    if (!this.activeBoard()) {
      throw new NotInABoardCurrentlyError();
    }
    try {
      await this.http.delete(`${this.apiBaseUrl}/board/${this.activeBoard()!._id}/allowed-member/${userId}`, { observe: 'response' }).toPromise();
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new BoardNotFoundError();
        case StatusCodes.CONFLICT:
          throw new UserNotPartOfThisBoardError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  //  TODO: hier noch adden, wenn die Seite verlassen wird, dass active member entfernt wird
  public async joinBoard(board: Board, userId: string): Promise<void> {
    try {
      this.activeMember.set(
        (await this.http.post<any>(`${this.apiBaseUrl}/active-member`, { userId: userId, boardId: board._id }, { observe: 'response' }).toPromise())!.body!,
      );
      this.activeBoard.set(board);
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
