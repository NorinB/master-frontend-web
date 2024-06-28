import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Project } from 'paper';
import { WebTransportService } from '../webtransport/webtransport.service';

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
  }
}
