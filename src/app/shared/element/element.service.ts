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
import { CreateElementEventMessage, CreateElementMessage, RemoveElementEventMessage, RemoveElementMessage } from './element.dto';
import ObjectId from 'bson-objectid';
import { WebTransportMessage } from '../webtransport/webtransport.dto';

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

  private getElementIdForElement(element: FabricObject): string {
    const elementId = Array.from(this.currentElements.entries()).find((entry) => entry[1] === element)?.[0];
    if (!elementId) {
      throw new ElementNotFoundError();
    }
    return elementId;
  }

  public async loadExistingElements(): Promise<void> {
    // TODO: hier weitermachen
  }

  private createElement(path: string, top: number, left: number, fill: string, scaleX: number, scaleY: number, rotation: number): FabricObject {
    const element = new Path(path, { top: top, left: left, fill: fill, scaleX: scaleX, scaleY: scaleY });
    element.rotate(rotation);
    element.on('selected', async (event) => {
      const element = event.target;
      try {
        const elementId = this.getElementIdForElement(element);
        await this.webTransportService.sendElementMessage(
          // TODO: hier muss gehandelt werden, dass man auf ne antwort vom Webtransport warten muss
          JSON.stringify(
            new WebTransportMessage<RemoveElementMessage>({
              messageType: 'element_lockelement',
              body: {
                _id: elementId,
                boardId: this.boardService.activeBoard()!._id,
                userId: this.authService.user()!.id,
              },
            }),
          ),
        );
      } catch (e) {
        console.log(e);
      }
    });
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

  public async createElementByUser(elementName: string): Promise<void> {
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
        JSON.stringify(
          new WebTransportMessage<CreateElementMessage>({
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
        ),
      );
      this.currentElements.set(elementId, element);
      this.canvas()!.add(element);
    } catch (e) {
      console.log(e);
    }
  }

  public async removeSelectionFromCanvas(): Promise<void> {
    this.checkIfCanvasIsReady();
    const activeObjects = this.canvas()!.getActiveObjects();
    for (const element of activeObjects) {
      await this.removeElementByUser(element);
    }
  }

  public removeElementByEvent(message: RemoveElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    this.currentElements.delete(message._id);
    this.canvas()!.remove(foundElement);
  }

  public async removeElementByUser(element: FabricObject): Promise<void> {
    this.checkIfCanvasIsReady();
    const elementId = this.getElementIdForElement(element);
    try {
      await this.webTransportService.sendElementMessage(
        JSON.stringify(
          new WebTransportMessage<RemoveElementMessage>({
            messageType: 'element_removeelement',
            body: {
              _id: elementId,
              boardId: this.boardService.activeBoard()!._id,
              userId: this.authService.user()!.id,
            },
          }),
        ),
      );
    } catch (e) {
      console.log(e);
    }
    this.currentElements.delete(elementId);
    this.canvas()!.remove(element);
  }
}
