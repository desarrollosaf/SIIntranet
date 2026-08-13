import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected loginFallido = false;

  protected readonly form = this.formBuilder.nonNullable.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { usuario, password } = this.form.getRawValue();
    const exito = this.authService.login(usuario, password);

    if (exito) {
      this.router.navigateByUrl('/');
    } else {
      this.loginFallido = true;
    }
  }
}
