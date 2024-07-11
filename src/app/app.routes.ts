import { ActivatedRouteSnapshot, GuardResult, MaybeAsync, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { BoardSelectionComponent } from './board-selection/board-selection.component';
import { inject } from '@angular/core';
import { AuthService } from './shared/auth/auth.service';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { LoggedInUser } from './shared/auth/auth.model';
import { BoardComponent } from './board/board.component';
import { BoardService } from './shared/board/board.service';
import { ActiveMemberService } from './shared/active-member/active-member.service';
import { WebTransportService } from './shared/webtransport/webtransport.service';
import { CanvasService } from './shared/canvas/canvas.service';

export const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [redirectIfLoggedIn],
  },
  {
    path: 'board-selection',
    component: BoardSelectionComponent,
    canActivate: [checkIfLoggedIn],
  },
  {
    path: 'board/:boardId',
    component: BoardComponent,
    canActivate: [checkIfLoggedInAndPartOfBoard],
    canDeactivate: [removeActiveMemberember, closeWebTransport, disposeCanvas],
  },
];

function redirectIfLoggedIn(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
  const authService = inject(AuthService);
  let storedClientJson: LoggedInUser | null;
  const router = inject(Router);
  try {
    storedClientJson = authService.getValidStoredUser();
  } catch (e) {
    return true;
  }
  if (!storedClientJson) {
    return true;
  }
  try {
    return authService.clientIsLoggedIn(storedClientJson.id, storedClientJson.clientId).pipe(
      tap((loggedIn) => {
        if (loggedIn) {
          router.navigate(['board-selection']);
        }
      }),
    );
  } catch (e) {
    console.log(e);
    return true;
  }
}

function removeActiveMemberember(
  _: any,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot,
): MaybeAsync<GuardResult> {
  const activeMemberService = inject(ActiveMemberService);
  try {
    activeMemberService.leaveBoardAsActiveMember();
  } finally {
    return true;
  }
}

function closeWebTransport(): MaybeAsync<GuardResult> {
  const webTransportService = inject(WebTransportService);
  try {
    webTransportService.closeConnection();
  } finally {
    return true;
  }
}

function disposeCanvas(): boolean {
  const canvasService = inject(CanvasService);
  canvasService.dispose();
  return true;
}

function checkIfLoggedInAndPartOfBoard(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
  if (!route.params['boardId']) {
    return false;
  }
  const authService = inject(AuthService);
  const router = inject(Router);
  const boardService = inject(BoardService);
  let storedClientJson: LoggedInUser | null;
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
      switchMap((loggedIn) => {
        if (!loggedIn) {
          router.navigate(['auth']);
          return of(false);
        }
        return boardService.userIsPartOfBoard(route.params['boardId']).pipe(
          tap((isPart) => {
            if (!isPart) {
              router.navigate(['board-selection']);
            }
            return from(boardService.getBoardById(route.params['boardId'])).pipe(
              tap((board) => {
                boardService.setActiveBoard(board);
              }),
            );
          }),
        );
      }),
    );
  } catch (e) {
    console.log(e);
    router.navigate(['auth']);
    return false;
  }
}

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
