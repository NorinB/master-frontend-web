import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebTransportService } from '../webtransport/webtransport.service';
// @ts-ignore: Unused parameter
import { Canvas, Circle, FabricObject, FabricText, Path } from 'fabric';
import { ElementNotFoundError, NoCreatableElementsFoundError } from './element.error';
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
import { CanvasService } from '../canvas/canvas.service';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private apiBaseUrl = environment.apiBaseUrl;
  public creatableElements: WritableSignal<Map<string, ElementType>> = signal(new Map<string, ElementType>());
  public currentElements = new Map<string, FabricObject>();

  constructor(
    private webTransportService: WebTransportService,
    private boardService: BoardService,
    private authService: AuthService,
    private canvasService: CanvasService,
    private http: HttpClient,
  ) {}

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
    this.canvasService.isReady();
    this.currentElements = new Map<string, FabricObject>();
    this.canvasService.clear();
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

  private createElement(id: string, path: string, x: number, y: number, fill: string, scaleX: number, scaleY: number, rotation: number): void {
    const element = new Path(path, { fill: fill, scaleX: scaleX, scaleY: scaleY });
    element.setX(x);
    element.setY(y);
    element.rotate(rotation);
    element.on('mousedown', async (event) => {
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
    element.on('rotating', async (event) => {
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
    element.on('scaling', async (event) => {
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
    element.on('moving', async (event) => {
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
    this.canvasService.addElement(element);
  }

  public createElementByEvent(message: CreateElementEventMessage): void {
    this.canvasService.isReady();
    const elementTypeEntry = Array.from(this.creatableElements().entries()).find((entry) => entry[0] === message.elementType);
    if (!elementTypeEntry) {
      throw new ElementNotFoundError();
    }
    const elementType = elementTypeEntry[1];
    this.createElement(message._id, elementType.path, message.x, message.y, message.color, message.scaleX, message.scaleY, message.rotation);
  }

  public async createElementByUser(elementName: string): Promise<void> {
    this.canvasService.isReady();
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
    this.canvasService.isReady();
    const activeObjects = this.canvasService.getActiveObjects();
    for (const element of activeObjects) {
      try {
        await this.removeElementByUser(element);
      } catch (e) {
        continue;
      }
    }
  }

  public removeElementByEvent(message: RemoveElementEventMessage): void {
    this.canvasService.isReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    this.currentElements.delete(message._id);
    this.canvasService.removeElement(foundElement);
    this.canvasService.refresh();
  }

  public async removeElementByUser(element: FabricObject): Promise<void> {
    this.canvasService.isReady();
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
    this.canvasService.isReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    foundElement.selectable = false;
    this.canvasService.refresh();
  }

  public unlockElementByEvent(message: LockElementEventMessage): void {
    this.canvasService.isReady();
    const foundElement = this.currentElements.get(message._id);
    if (!foundElement) {
      throw new ElementNotFoundError();
    }
    foundElement.selectable = true;
    this.canvasService.refresh();
  }

  public moveElementsByEvent(message: MoveElementEventMessage): void {
    this.canvasService.isReady();
    const element = this.currentElements.get(message._id);
    if (!element) {
      return;
    }
    element.setX(message.xOffset + element.getX());
    element.setY(message.yOffset + element.getY());
    this.canvasService.refresh();
  }

  public updateElementByEvent(message: UpdateElementEventMessage): void {
    this.canvasService.isReady();
    const element = this.currentElements.get(message._id);
    if (!element) {
      return;
    }
    if (typeof message.rotation === 'number') {
      element.rotate(message.rotation);
    }
    if (typeof message.zIndex === 'number') {
      this.canvasService.changeZIndex(element, message.zIndex);
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
    this.canvasService.refresh();
  }
}
