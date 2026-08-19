import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Encabezado visual compacto reutilizable para las vistas principales.
 * Renderiza el único h1 de la página que lo usa — quien lo integra no debe
 * dejar otro h1 duplicado. Deliberadamente mínimo: sin descripción,
 * subtítulo, acciones ni slots — ver ETAPA 15C.0.
 */
@Component({
  selector: 'app-page-hero',
  imports: [],
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHero {
  readonly titulo = input.required<string>();
  readonly icono = input.required<string>();
}
