import { Injectable, WritableSignal, signal } from '@angular/core';
import { ActiveMember, CursorPosition } from './active-member.model';
import { Board } from '../board/board.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BoardService } from '../board/board.service';
import { StatusCodes } from 'http-status-codes';
import { BoardNotFoundError, NotInABoardCurrentlyError, UserNotPartOfThisBoardError } from '../board/board.error';
import { UnexpectedApiError } from '../general.error';
import { environment } from '../../../environments/environment';
import { ActiveMemberNotFoundError, BoardHasNoActiveMembersError } from './active-member.error';
import { AuthService } from '../auth/auth.service';
import { NotLoggedInError } from '../auth/auth.error';
import { Subject, Subscription, interval, sample } from 'rxjs';
import { WebTransportService } from '../webtransport/webtransport.service';
import { WebTransportMessage } from '../webtransport/webtransport.dto';
import {
  ActiveMemberAddEventMessage,
  ActiveMemberRemoveEventMessage,
  ActiveMemberUpdatePositionEventMessage,
  ActiveMemberUpdatePositionMessage,
} from './active-member.dto';
import { CanvasService } from '../canvas/canvas.service';
import { FabricObject } from 'fabric';

@Injectable({
  providedIn: 'root',
})
export class ActiveMemberService {
  private apiBaseUrl = environment.apiBaseUrl;
  public activeMember: WritableSignal<ActiveMember | null> = signal(null);
  public currentActiveMembers: Map<string, { member: ActiveMember; canvasElement: FabricObject }> = new Map<
    string,
    { member: ActiveMember; canvasElement: FabricObject }
  >();
  private cursorPositionSubject = new Subject<CursorPosition>();
  private cursorPostionSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private boardService: BoardService,
    private authService: AuthService,
    private webTransportService: WebTransportService,
    private canvasService: CanvasService,
  ) {}

  public async loadExistingActiveMembers(): Promise<void> {
    try {
      if (!this.boardService.activeBoard()) {
        throw new NotInABoardCurrentlyError();
      }
      if (!this.authService.user()) {
        throw new NotLoggedInError();
      }
      const response = await this.http
        .get<ActiveMember[]>(`${this.apiBaseUrl}/active-member/board/${this.boardService.activeBoard()?._id}`, { observe: 'response' })
        .toPromise();
      for (const member of this.currentActiveMembers.values()) {
        this.canvasService.removeElement(member.canvasElement);
      }
      this.currentActiveMembers.clear();
      for (const activeMember of response!.body!) {
        if (activeMember.userId === this.authService.user()!.id) {
          continue;
        }
        const canvasElement = this.canvasService.addActiveMember(activeMember.x, activeMember.y);
        this.currentActiveMembers.set(activeMember.userId, { member: activeMember, canvasElement: canvasElement });
      }
      this.canvasService.refresh();
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          throw new BoardHasNoActiveMembersError();
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public emitNewCursorPosition(pos: CursorPosition): void {
    this.cursorPositionSubject.next(pos);
  }

  public setupCursorSubscription(): void {
    if (this.cursorPostionSubscription) {
      this.cursorPostionSubscription.unsubscribe();
    }
    this.canvasService.canvas()!.on('mouse:move', (event) => {
      const pointerPosition = this.canvasService.canvas()!.getViewportPoint(event.e);
      this.emitNewCursorPosition({ x: pointerPosition.x, y: pointerPosition.y });
    });
    this.cursorPostionSubscription = this.cursorPositionSubject.pipe(sample(interval(1))).subscribe((cursorPosition) => {
      try {
        this.webTransportService.sendActiveMemberMessage(
          JSON.stringify(
            new WebTransportMessage<ActiveMemberUpdatePositionMessage>({
              messageType: 'activemember_updateposition',
              body: {
                userId: this.authService.user()!.id,
                boardId: this.boardService.activeBoard()!._id,
                x: cursorPosition.x,
                y: cursorPosition.y,
              },
            }),
          ),
        );
      } catch (e) {
        this.cursorPostionSubscription?.unsubscribe();
      }
    });
  }

  public addActiveMemberByEvent(message: ActiveMemberAddEventMessage): void {
    this.canvasService.isReady();
    const element = this.canvasService.addActiveMember(0, 0);
    this.currentActiveMembers.set(message.userId, {
      member: { userId: message.userId, boardId: message.boardId, _id: message._id, x: 0, y: 0 },
      canvasElement: element,
    });
    this.canvasService.refresh();
  }

  public removeActiveMemberByEvent(message: ActiveMemberRemoveEventMessage): void {
    const element = this.currentActiveMembers.get(message.userId)?.canvasElement;
    if (!element) {
      throw new ActiveMemberNotFoundError();
    }
    this.canvasService.removeElement(element);
    this.currentActiveMembers.delete(message.userId);
    this.canvasService.refresh();
  }

  public updateActiveMemberPosition(message: ActiveMemberUpdatePositionEventMessage): void {
    const element = this.currentActiveMembers.get(message.userId)?.canvasElement;
    if (!element) {
      throw new ActiveMemberNotFoundError();
    }
    element.setX(message.x);
    element.setY(message.y);
    this.canvasService.refresh();
  }

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
