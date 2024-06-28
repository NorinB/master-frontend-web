import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Project, Shape } from 'paper';
import { WebTransportService } from '../webtransport/webtransport.service';
import { Point, PointText } from 'paper/dist/paper-core';

@Injectable({
  providedIn: 'root',
})
export class ElementService {
  private apiBaseUrl = environment.apiBaseUrl;
  public paperProject: WritableSignal<paper.Project | null> = signal(null);

  constructor(private webTransportService: WebTransportService) {
    console.log(this.apiBaseUrl);
  }

  public setupCanvas(canvasElement: HTMLCanvasElement): void {
    this.paperProject.set(new Project(canvasElement));
  }

  public getCreatableElements(): string[] {
    return ['Circle'];
  }

  public async createElement(elementName: string): Promise<void> {
    console.log(this.webTransportService);
    new Shape.Circle({
      center: [100, 100],
      radius: 50,
      fillColor: 'red',
    });
    new Shape.Rectangle({
      center: [100, 300],
      size: [100, 50],
      fillColor: 'green',
      strokeColor: 'black',
      strokeWidth: 4,
      rotation: -20,
    });
    var text = new PointText(new Point(100, 150));
    text.content = 'This is also a test';
    /*
        text.scale(5);
        text.translate(15, 15);
        text.rotate(20);
        text.shear(20, 5);
        */
    text.rotate(45);
    text.shear(0.85, 0.15);
    text.scale(0.85, 2);
  }
}
