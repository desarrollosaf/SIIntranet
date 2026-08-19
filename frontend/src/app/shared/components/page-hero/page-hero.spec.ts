import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHero } from './page-hero';

describe('PageHero', () => {
  let fixture: ComponentFixture<PageHero>;

  function crear(titulo: string, icono: string): void {
    TestBed.configureTestingModule({ imports: [PageHero] });
    fixture = TestBed.createComponent(PageHero);
    fixture.componentRef.setInput('titulo', titulo);
    fixture.componentRef.setInput('icono', icono);
    fixture.detectChanges();
  }

  it('crea el componente', () => {
    crear('Bandeja de entrada', 'bi-inbox');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el título recibido', () => {
    crear('Bandeja de entrada', 'bi-inbox');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bandeja de entrada');
  });

  it('el título se renderiza como h1', () => {
    crear('Formatos', 'bi-folder2-open');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Formatos');
  });

  it('renderiza la clase de icono recibida', () => {
    crear('Bandeja de entrada', 'bi-inbox');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('i.bi-inbox')).toBeTruthy();
  });

  it('el icono es aria-hidden', () => {
    crear('Bandeja de entrada', 'bi-inbox');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('i.bi-inbox')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no genera descripción, subtítulo ni otro heading adicional', () => {
    crear('Bandeja de entrada', 'bi-inbox');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')).toBeNull();
    expect(compiled.querySelector('h2')).toBeNull();
    expect(compiled.querySelectorAll('h1').length).toBe(1);
  });
});
