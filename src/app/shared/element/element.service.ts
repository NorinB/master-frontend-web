import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebTransportService } from '../webtransport/webtransport.service';
// @ts-ignore: Unused parameter
import { Canvas, Circle, FabricText, Path } from 'fabric';
import { CanvasNotReadyError, ElementNotFoundError } from './element.error';
import { ElementType, getRandomColor } from './element.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { UnexpectedApiError } from '../general.error';
import { BoardService } from '../board/board.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private apiBaseUrl = environment.apiBaseUrl;
  public canvas: WritableSignal<Canvas | null> = signal(null);
  public creatableElements: WritableSignal<ElementType[]> = signal([]);

  constructor(
    private webTransportService: WebTransportService,
    private boardService: BoardService,
    private http: HttpClient,
  ) {}

  private checkIfCanvasIsReady(): void {
    if (!this.canvas()) {
      throw new CanvasNotReadyError();
    }
  }

  public setupCanvas(canvasElement: HTMLCanvasElement): void {
    this.canvas.set(
      new Canvas(canvasElement, {
        selection: true,
        containerClass: 'canvas',
        height: canvasElement.parentElement?.clientHeight,
        width: canvasElement.parentElement?.clientWidth,
      }),
    );
  }

  public async disposeCanvas(): Promise<void> {
    try {
      this.checkIfCanvasIsReady();
    } catch (e) {
      return;
    }
    await this.canvas()!.dispose();
  }

  public handleWindowResize(event) {
    if (!this.canvas()) {
      return;
    }
    this.canvas()?.setHeight(this.canvas()!.getElement().parentElement!.parentElement!.clientHeight);
    this.canvas()?.setWidth(this.canvas()!.getElement().parentElement!.parentElement!.clientWidth);
  }

  public async getCreatableElements(): Promise<void> {
    try {
      const response = await this.http.get(`${this.apiBaseUrl}/element-types`, { observe: 'response' }).toPromise();
      this.creatableElements.set(response!.body as ElementType[]);
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          this.creatableElements.set([]);
          break;
        default: {
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async createElement(elementName: string): Promise<void> {
    this.checkIfCanvasIsReady();
    const foundElement = this.creatableElements().find((elementType) => elementType.name === elementName);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    const color = getRandomColor();
    const element = new Path(foundElement.path, { top: 300, left: 300, fill: color });
    try {
      await this.webTransportService.sendElementMessage(
        JSON.stringify({
          messageType: 'element_createelement',
          body: {
            selected: false,
            lockedBy: null,
            x: 300,
            y: 300,
            rotation: 0,
            scale: 1,
            zIndex: 1,
            createdAt: new Date().toISOString(),
            text: '',
            elementType: foundElement._id,
            boardId: this.boardService.activeBoard()!._id,
            color: color,
          },
        }),
      );
    } catch (e) {
      console.log(e);
      return;
    }
    this.canvas()!.add(element);
  }
}
