import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'auth',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  formGroup = new FormGroup({
    nameOrEmail: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    confirmedPassword: new FormControl('', [Validators.required]),
  });
  isRegistration = false;
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  async onSubmit(): Promise<void> {
    this.loading = true;
    const nameOrEmail: string = this.formGroup.get('nameOrEmail')!.value!;
    const password: string = this.formGroup.get('password')!.value!;
    if (this.isRegistration) {
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
        this.loading = false;
      }
    }
    this.router.navigate(['board-selection']);
  }
}
