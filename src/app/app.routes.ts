import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { BoardSelectionComponent } from './board-selection/board-selection.component';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Observable, tap } from 'rxjs';
import { LoggedInUser } from './auth/auth.models';

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
    canActivate: [checkIfLoggedIn],
  },
];

function checkIfLoggedIn(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
  const authService = inject(AuthService);
  let storedClientJson: LoggedInUser | null;
  const router = inject(Router);
  try {
    storedClientJson = authService.getValidStoredUser();
  } catch (e) {
    router.navigate(['auth']);
    return false;
  }
  if (!storedClientJson) {
    router.navigate(['auth']);
    return false;
  }
  try {
    return authService.clientIsLoggedIn(storedClientJson.id, storedClientJson.clientId).pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          router.navigate(['auth']);
        }
      }),
    );
  } catch (e) {
    console.log(e);
    router.navigate(['auth']);
    return false;
  }
}
