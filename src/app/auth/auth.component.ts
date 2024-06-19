import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AppbarService } from '../shared/title.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { defaultSnackbarConfig } from '../shared/snackbar-config';

@Component({
  selector: 'auth',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  formGroup: FormGroup;
  isRegistration = false;
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private appbarService: AppbarService,
    private snackBar: MatSnackBar,
  ) {
    this.formGroup = new FormGroup({
      nameOrEmail: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required]),
    });
    this.formGroup.addControl('confirmedPassword', new FormControl('', [Validators.required, this.checkConfirmedPassword(this.formGroup)]));
    this.updateTitle('Login');
    this.appbarService.setActions([]);
  }

  private updateTitle(title: string): void {
    this.appbarService.updateTitle(title);
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    const nameOrEmail: string = this.formGroup.get('nameOrEmail')!.value!;
    const password: string = this.formGroup.get('password')!.value!;
    if (this.isRegistration) {
      const email: string = this.formGroup.get('email')!.value!;
      try {
        console.log(email, nameOrEmail, password);
        await this.authService.register(email, nameOrEmail, password);
      } catch (e) {
        console.log(e);
        return;
      } finally {
        this.loading = false;
      }
    } else {
      const isEmail = nameOrEmail.includes('@');
      const email = isEmail ? nameOrEmail : null;
      const name = isEmail ? null : nameOrEmail;
      try {
        await this.authService.login(email, name, password);
      } catch (e) {
        console.log(e);
        return;
      } finally {
        this.snackBar.open('Eingeloggt 🎉', undefined, defaultSnackbarConfig());
        this.loading = false;
      }
    }
    this.router.navigate(['board-selection']);
  }

  public switchLoginAndRegistration() {
    if (this.isRegistration) {
      this.isRegistration = false;
      this.updateTitle('Login');
    } else {
      this.isRegistration = true;
      this.updateTitle('Registrierung');
    }
  }

  private checkConfirmedPassword(formGroup: FormGroup) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === this.formGroup.get('password')!.value) {
        return null;
      } else {
        return {
          passwordsDontMatch: true,
        };
      }
    };
  }
}
