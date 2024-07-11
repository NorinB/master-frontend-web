import { Injectable, WritableSignal, signal } from '@angular/core';
import { Canvas, FabricObject, Path } from 'fabric';
import { CanvasNotReadyError } from './canvas.error';
import { getRandomColor } from '../element/element.model';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  public canvas: WritableSignal<Canvas | null> = signal(null);

  public isReady(): void {
    if (!this.canvas()) {
      throw new CanvasNotReadyError();
    }
  }

  public clear(): void {
    this.canvas()?.clear();
  }

  public addElement(element: FabricObject): void {
    this.canvas()?.add(element);
  }

  public getActiveObjects(): FabricObject[] {
    this.isReady();
    return this.canvas()!.getActiveObjects();
  }

  public refresh(): void {
    this.canvas()?.renderAll();
  }

  public removeElement(element: FabricObject): void {
    this.canvas()?.remove(element);
  }

  public changeZIndex(element: FabricObject, value: number): void {
    this.canvas()?.moveObjectTo(element, value);
  }

  public addActiveMember(x: number, y: number): FabricObject {
    this.isReady();
    const cursorPath = 'M 0 0 L 5 5 L 3 5 L 2 7 Z';
    const cursor = new Path(cursorPath, { left: x, top: y, fill: getRandomColor() });
    cursor.scale(3);
    this.canvas()!.add(cursor);
    return cursor;
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

  public async dispose(): Promise<void> {
    try {
      this.isReady();
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
}