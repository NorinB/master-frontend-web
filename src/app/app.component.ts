import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { AppbarService } from './shared/title.service';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './shared/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UnexpectedApiError } from './shared/general.error';
import { defaultSnackbarConfig } from './shared/snackbar-config';
import { NotLoggedInError } from './shared/auth/auth.error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, AsyncPipe, MatButtonModule, MatButtonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    public appbarService: AppbarService,
    private snackBar: MatSnackBar,
  ) {}

  public async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.snackBar.open('Ausgeloggt 👋', undefined, defaultSnackbarConfig());
    } catch (e) {
      if (e instanceof UnexpectedApiError) {
        this.snackBar.open('Logout fehlgeschlagen', 'Ok', defaultSnackbarConfig());
      }
      if (e instanceof NotLoggedInError) {
        this.snackBar.open('Nicht eingeloggt', 'Ok', defaultSnackbarConfig());
      }
    }
  }
}
