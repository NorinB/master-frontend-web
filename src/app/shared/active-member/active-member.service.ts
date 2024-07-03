import { Injectable, WritableSignal, signal } from '@angular/core';
import { ActiveMember } from './active-member.model';
import { Board } from '../board/board.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BoardService } from '../board/board.service';
import { StatusCodes } from 'http-status-codes';
import { BoardNotFoundError, NotInABoardCurrentlyError, UserNotPartOfThisBoardError } from '../board/board.error';
import { UnexpectedApiError } from '../general.error';
import { environment } from '../../../environments/environment';
import { ActiveMemberNotFoundError } from './active-member.error';
import { AuthService } from '../auth/auth.service';
import { NotLoggedInError } from '../auth/auth.error';

@Injectable({
  providedIn: 'root',
})
export class ActiveMemberService {
  private apiBaseUrl = environment.apiBaseUrl;
  public activeMember: WritableSignal<ActiveMember | null> = signal(null);

  constructor(
    private http: HttpClient,
    private boardService: BoardService,
    private authService: AuthService,
  ) {}

  public async joinBoardAsActiveMember(board: Board, userId: string): Promise<void> {
    try {
      this.activeMember.set(
        (await this.http.post<any>(`${this.apiBaseUrl}/active-member`, { userId: userId, boardId: board._id }, { observe: 'response' }).toPromise())!.body!,
      );
      this.boardService.setActiveBoard(board);
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.CONFLICT:
          return this.changeActiveBoard(board);
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

  public async changeActiveBoard(board: Board | null): Promise<void> {
    if (!board) {
      throw new NotInABoardCurrentlyError();
    }
    if (!this.authService.user()) {
      throw new NotLoggedInError();
    }
    try {
      const response = await this.http
        .put<any>(`${this.apiBaseUrl}/active-member/board`, { userId: this.authService.user()!.id, newBoardId: board!._id }, { observe: 'response' })
        .toPromise();
      const activeMember = response!.body!;
      this.activeMember.set(activeMember);
      this.boardService.setActiveBoard(board);
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          if (errorResponse.statusText.includes('Board')) {
            throw new BoardNotFoundError();
          }
          throw new ActiveMemberNotFoundError();
        case StatusCodes.FORBIDDEN:
          throw new UserNotPartOfThisBoardError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async leaveBoardAsActiveMember(): Promise<void> {
    if (!this.activeMember()) {
      throw new ActiveMemberNotFoundError();
    }
    try {
      await this.http
        .delete(`${this.apiBaseUrl}/active-member/${this.activeMember()!.userId}/board/${this.boardService.activeBoard()!._id}`, { observe: 'response' })
        .toPromise();
      this.activeMember.set(null);
      this.boardService.setActiveBoard(null);
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          this.activeMember.set(null);
          throw new ActiveMemberNotFoundError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }
}
