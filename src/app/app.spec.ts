import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.isLoggedIn = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Inicio');
  });

  it('should clear notifications after timeout', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.mostrarNotificacion('Recordatorio agregado correctamente.', 'exito');
    expect(app.notificacion?.mensaje).toBe('Recordatorio agregado correctamente.');
    vi.advanceTimersByTime(3100);
    expect(app.notificacion).toBeNull();
    vi.useRealTimers();
  });
});
