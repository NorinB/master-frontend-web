import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { BoardSelectionComponent } from './board-selection/board-selection.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
  {
    path: 'board-selection',
    component: BoardSelectionComponent,
  },
];
