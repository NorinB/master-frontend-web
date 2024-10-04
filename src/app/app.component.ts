import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterEvent, RouterOutlet } from '@angular/router';
import { AppbarService } from './shared/appbar.service';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './shared/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UnexpectedApiError } from './shared/general.error';
import { defaultSnackbarConfig } from './shared/snackbar-config';
import { NotLoggedInError } from './shared/auth/auth.error';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { WebTransportService } from './shared/webtransport/webtransport.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, AsyncPipe, MatButtonModule, MatButtonModule, MatIconModule, MatSlideToggle, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public sliderIsActive = false;
  public showEventsPerSecond = false;

  constructor(
    public authService: AuthService,
    public appbarService: AppbarService,
    private snackBar: MatSnackBar,
    private router: Router,
    public webTransportService: WebTransportService,
  ) {
    this.sliderIsActive = router.url.includes('/board/');
    this.router.events.subscribe((event) => {
      this.sliderIsActive = event instanceof RouterEvent && event.url.includes('/board/');
    });
  }

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
