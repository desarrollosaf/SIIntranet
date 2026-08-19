import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { InicioPage } from './inicio-page';
import { AuthService } from '../../../../core/auth/auth.service';

describe('InicioPage', () => {
  let component: InicioPage;
  let fixture: ComponentFixture<InicioPage>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    (authService as any).currentUserSignal.set({
      id: 'dev-usuario-2',
      nombre: 'sergio',
      usuario: 'sergio',
      rol: 'Usuario',
    });

    fixture = TestBed.createComponent(InicioPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el hero muestra "Inicio" como único h1 de la página', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Inicio');
  });

  it('sigue mostrando el nombre del CurrentUser con sesión provisional válida', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('sergio');
  });
});
