import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { LoginPage } from './login-page';
import { AuthService } from '../../../../core/auth/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formulario inválido no intenta login ni navegación', () => {
    vi.spyOn(authService, 'login');

    (component as any).onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('submit válido llama a AuthService.login', () => {
    vi.spyOn(authService, 'login');

    (component as any).form.setValue({ usuario: 'sergio', password: 'clave123' });
    (component as any).onSubmit();

    expect(authService.login).toHaveBeenCalledWith('sergio', 'clave123');
  });

  it('login exitoso navega a /', () => {
    (component as any).form.setValue({ usuario: 'sergio', password: 'clave123' });
    (component as any).onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
