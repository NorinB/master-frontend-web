import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebTransportService } from '../webtransport/webtransport.service';
// @ts-ignore: Unused parameter
import { Canvas, Circle, FabricObject, FabricText, Path } from 'fabric';
import { CanvasNotReadyError, ElementNotFoundError, NoCreatableElementsFoundError } from './element.error';
import { Element, ElementType, getRandomColor } from './element.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { UnexpectedApiError } from '../general.error';
import { BoardService } from '../board/board.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateElementEventMessage,
  CreateElementMessage,
  ElementTypeDto,
  LockElementEventMessage,
  MoveElementEventMessage,
  RemoveElementEventMessage,
  RemoveElementMessage,
  UpdateElementEventMessage,
  UpdateElementMessage,
} from './element.dto';
import ObjectId from 'bson-objectid';
import { WebTransportMessage } from '../webtransport/webtransport.dto';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private apiBaseUrl = environment.apiBaseUrl;
  public canvas: WritableSignal<Canvas | null> = signal(null);
  public creatableElements: WritableSignal<Map<string, ElementType>> = signal(new Map<string, ElementType>());
  private currentElements = new Map<string, FabricObject>();
  // private lastPosition: ElementPosition | null = null;

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
    // this.canvas()!.on('mouse:down:before', (event) => {
    //   if (!event.target) {
    //     return;
    //   }
    //   this.lastPosition = {
    //     x: event.target!.getX(),
    //     y: event.target!.getY(),
    //   };
    // });
    // this.canvas()!.on('mouse:up:before', async (event) => {
    //   if (!event.target) {
    //     return;
    //   }
    //   const element = event.target;
    //   try {
    //     const activeElements = this.canvas()!.getActiveObjects();
    //     let ids: string[] = [];
    //     for (const activeElement of activeElements) {
    //       try {
    //         const id = this.getElementIdForElement(activeElement);
    //         ids.push(id);
    //       } catch (e) {
    //         continue;
    //       }
    //     }
    //     await this.webTransportService.sendElementMessage(
    //       JSON.stringify(
    //         new WebTransportMessage<MoveElementMessage>({
    //           messageType: 'element_moveelements',
    //           body: {
    //             ids: ids,
    //             userId: this.authService.user()!.id,
    //             boardId: this.boardService.activeBoard()!._id,
    //             xOffset: element!.getX() - this.lastPosition!.x,
    //             yOffset: element!.getY() - this.lastPosition!.y,
    //           },
    //         }),
    //       ),
    //     );
    //   } catch (e) {
    //     console.log(e);
    //   } finally {
    //     this.lastPosition = null;
    //   }
    // });
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
      this.creatableElements.set(new Map<string, ElementType>());
      this.creatableElements.update((current) => {
        for (const elementType of response!.body! as ElementTypeDto[]) {
          current.set(elementType._id, { name: elementType.name, path: elementType.path });
        }
        return current;
      });
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          this.creatableElements.set(new Map<string, ElementType>());
          throw new NoCreatableElementsFoundError();
        default: {
          this.creatableElements.set(new Map<string, ElementType>());
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
    this.checkIfCanvasIsReady();
    this.currentElements = new Map<string, FabricObject>();
    this.canvas()!.clear();
    try {
      const elements = await this.http
        .get<Element[]>(`${this.apiBaseUrl}/board/${this.boardService.activeBoard()!._id}/elements`, { observe: 'response' })
        .toPromise();
      for (const element of elements!.body! as Element[]) {
        const elementType = this.creatableElements().get(element.elementType);
        if (!elementType) {
          continue;
        }
        this.createElement(element._id, elementType.path, element.x, element.y, element.color, element.scaleX, element.scaleY, element.rotation);
      }
    } catch (e) {
      console.error(e);
      const errorResponse = e as HttpErrorResponse;
      switch (errorResponse.status) {
        case StatusCodes.NOT_FOUND:
          this.currentElements.clear();
          break;
        default: {
          this.currentElements.clear();
          throw new UnexpectedApiError();
        }
      }
    }
  }

  public async unlockAllElements(): Promise<void> {
    try {
      await this.http
        .put(
          `${this.apiBaseUrl}/element/multiple/unlock-all?userId=${this.authService.user()?.id}&boardId=${this.boardService.activeBoard()?._id}`,
          undefined,
          { observe: 'response' },
        )
        .toPromise();
    } catch (e) {
      const errorResponse = e as HttpErrorResponse;
      console.log(errorResponse);
    }
  }

  private createElement(id: string, path: string, top: number, left: number, fill: string, scaleX: number, scaleY: number, rotation: number): void {
    const element = new Path(path, { top: top, left: left, fill: fill, scaleX: scaleX, scaleY: scaleY });
    element.rotate(rotation);
    element.on('modified', async (event) => {
      const element = event.target;
      try {
        const elementId = this.getElementIdForElement(element);
        await this.webTransportService.sendElementMessage(
          JSON.stringify(
            new WebTransportMessage<UpdateElementMessage>({
              messageType: 'element_updateelement',
              body: {
                _id: elementId,
                userId: this.authService.user()!.id,
                boardId: this.boardService.activeBoard()!._id,
                scaleX: element.scaleX,
                scaleY: element.scaleY,
                x: element.getX(),
                y: element.getY(),
                text: undefined,
                color: element.fill?.toString(),
                zIndex: undefined,
                rotation: element.getTotalAngle(),
              },
            }),
          ),
        );
      } catch (e) {
        console.log(e);
      }
    });
    element.on('selected', async (event) => {
      const element = event.target as FabricObject;
      try {
        const elementId = this.getElementIdForElement(element);
        await this.webTransportService.sendElementMessage(
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
    element.on('deselected', async (event) => {
      const element = event.target;
      try {
        const elementId = this.getElementIdForElement(element);
        await this.webTransportService.sendElementMessage(
          JSON.stringify(
            new WebTransportMessage<RemoveElementMessage>({
              messageType: 'element_unlockelement',
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
    this.currentElements.set(id, element);
    this.canvas()!.add(element);
  }

  public createElementByEvent(message: CreateElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const elementTypeEntry = Array.from(this.creatableElements().entries()).find((entry) => entry[0] === message.elementType);
    if (!elementTypeEntry) {
      throw new ElementNotFoundError();
    }
    const elementType = elementTypeEntry[1];
    this.createElement(message._id, elementType.path, message.x, message.y, message.color, message.scaleX, message.scaleY, message.rotation);
  }

  public async createElementByUser(elementName: string): Promise<void> {
    this.checkIfCanvasIsReady();
    const foundElementEntry = Array.from(this.creatableElements().entries()).find((entry) => entry[1].name === elementName);
    if (!foundElementEntry) {
      throw new ElementNotFoundError();
    }
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
              elementType: foundElementEntry[0],
              boardId: this.boardService.activeBoard()!._id,
              color: getRandomColor(),
            },
          }),
        ),
      );
    } catch (e) {
      console.log(e);
    }
  }

  public async removeSelectionFromCanvas(): Promise<void> {
    this.checkIfCanvasIsReady();
    const activeObjects = this.canvas()!.getActiveObjects();
    for (const element of activeObjects) {
      try {
        await this.removeElementByUser(element);
      } catch (e) {
        continue;
      }
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
    this.canvas()!.renderAll();
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
  }

  public lockElementByEvent(message: LockElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    foundElement.selectable = false;
    this.canvas()!.renderAll();
  }

  public unlockElementByEvent(message: LockElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    foundElement.selectable = true;
    this.canvas()!.renderAll();
  }

  public moveElementsByEvent(message: MoveElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const element = this.currentElements.get(message._id);
    if (!element) {
      return;
    }
    element.setX(message.xOffset + element.getX());
    element.setY(message.yOffset + element.getY());
    // BUG: irgendwas beim Senden der Coors wird falsch im Server gespeichert
    // BUG: Syntaxerror bei JSON parsing noch
    this.canvas()!.renderAll();
  }

  public updateElementByEvent(message: UpdateElementEventMessage): void {
    this.checkIfCanvasIsReady();
    const element = this.currentElements.get(message._id);
    if (!element) {
      return;
    }
    if (typeof message.rotation === 'number') {
      element.rotate(message.rotation);
    }
    if (typeof message.zIndex === 'number') {
      this.canvas()!.moveObjectTo(element, message.zIndex);
    }
    if (typeof message.scaleX === 'number') {
      element.scaleX = message.scaleX;
    }
    if (typeof message.scaleY === 'number') {
      element.scaleY = message.scaleY;
    }
    if (message.color) {
      element.fill = message.color;
    }
    if (typeof message.x === 'number') {
      element.setX(message.x);
    }
    if (typeof message.y === 'number') {
      element.setY(message.y);
    }
    this.canvas()!.renderAll();
  }
}
