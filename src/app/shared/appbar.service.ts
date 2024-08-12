import { Injectable, WritableSignal, signal } from '@angular/core';

export interface AppbarAction {
  buttonId: string;
  icon: string;
  action: Function;
}

@Injectable({
  providedIn: 'root',
})
export class AppbarService {
  title: WritableSignal<string> = signal('');
  actions: WritableSignal<AppbarAction[]> = signal([]);
  backAction: WritableSignal<(() => void) | null> = signal(null);

  constructor() {}

  public updateTitle(title: string) {
    this.title.set(title);
  }

  public setActions(actions: AppbarAction[]) {
    this.actions.set(actions);
  }

  public setBackAction(action: (() => void) | null) {
    this.backAction.set(action);
  }
}
