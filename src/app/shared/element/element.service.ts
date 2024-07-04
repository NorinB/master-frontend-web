import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebTransportService } from '../webtransport/webtransport.service';
// @ts-ignore: Unused parameter
import { Canvas, Circle, FabricObject, FabricText, Path } from 'fabric';
import { CanvasNotReadyError, ElementNotFoundError } from './element.error';
import { ElementType, getRandomColor } from './element.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { UnexpectedApiError } from '../general.error';
import { BoardService } from '../board/board.service';
import { AuthService } from '../auth/auth.service';
import { CreateElementEventMessage } from './element.dto';
import ObjectId from 'bson-objectid';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private apiBaseUrl = environment.apiBaseUrl;
  public canvas: WritableSignal<Canvas | null> = signal(null);
  public creatableElements: WritableSignal<ElementType[]> = signal([]);
  private currentElements = new Map<string, FabricObject>();

  constructor(
    private webTransportService: WebTransportService,
    private boardService: BoardService,
    private authService: AuthService,
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

  public async loadExistingElements(): Promise<void> {
    // TODO: hier weitermachen
  }

  private createElement(path: string, top: number, left: number, fill: string, scaleX: number, scaleY: number, rotation: number): FabricObject {
    const element = new Path(path, { top: top, left: left, fill: fill, scaleX: scaleX, scaleY: scaleY });
    element.rotate(rotation);
    return element;
  }

  public createElementByEvent(message: CreateElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const elementType = this.creatableElements().find((elementType) => elementType._id === message.elementType);
    if (!elementType) {
      throw new ElementNotFoundError();
    }
    const element = this.createElement(elementType.path, message.x, message.y, message.color, message.scaleX, message.scaleY, message.rotation);
    this.currentElements.set(message._id, element);
    this.canvas()!.add(element);
  }

  public async createElementByClick(elementName: string): Promise<void> {
    this.checkIfCanvasIsReady();
    const foundElement = this.creatableElements().find((elementType) => elementType.name === elementName);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    const color = getRandomColor();
    const element = this.createElement(foundElement.path, 300, 300, color, 1, 1, 0);
    try {
      const elementId = ObjectId().toHexString();
      await this.webTransportService.sendElementMessage(
        JSON.stringify({
          messageType: 'element_createelement',
          body: {
            _id: elementId,
            userId: this.authService.user()!.id,
            selected: false,
            lockedBy: null,
            x: 300,
            y: 300,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            zIndex: 1,
            createdAt: new Date().toISOString(),
            text: '',
            elementType: foundElement._id,
            boardId: this.boardService.activeBoard()!._id,
            color: color,
          },
        }),
      );
      this.currentElements.set(elementId, element);
      this.canvas()!.add(element);
    } catch (e) {
      console.log(e);
    }
  }
}
