import { Injectable, WritableSignal, signal } from '@angular/core';

export interface AppbarAction {
  icon: string;
  action: Function;
}

@Injectable({
  providedIn: 'root',
})
export class AppbarService {
  title: WritableSignal<string> = signal('');
  actions: WritableSignal<AppbarAction[]> = signal([]);
  backAction: WritableSignal<Function | null> = signal(null);

  public updateTitle(title: string) {
    this.title.set(title);
  }

  public setActions(actions: AppbarAction[]) {
    this.actions.set(actions);
  }

  public setBackAction(action: Function) {
    this.backAction.set(action);
  }
}
