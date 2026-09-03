import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

type FiltroRol = 'Todos' | Usuario['rol'];
type FiltroEstado = 'Todos' | Usuario['estado'];

@Component({
  selector: 'app-usuarios-page',
  imports: [ReactiveFormsModule, PageHero],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.scss',
})
export class UsuariosPage implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly terminoBusqueda = signal('');
  protected readonly filtroRol = signal<FiltroRol>('Todos');
  protected readonly filtroEstado = signal<FiltroEstado>('Todos');

  protected readonly usuarioEnEdicionId = signal<string | null>(null);
  protected readonly errorEdicion = signal<string | null>(null);
  protected readonly guardando = signal(false);

  // Set de ids con una petición de cambio de estado en curso — permite
  // deshabilitar únicamente el botón de la fila afectada sin bloquear el
  // resto de la página ni el resto de las filas.
  protected readonly idsEnCambioEstado = signal<ReadonlySet<string>>(new Set());

  protected readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    usuario: ['', Validators.required],
    rol: this.formBuilder.nonNullable.control<Usuario['rol']>('Usuario', Validators.required),
  });

  // Filtro completamente local sobre los usuarios ya cargados — nunca muta
  // this.usuarios() ni dispara una nueva petición al backend.
  protected readonly usuariosFiltrados = computed<Usuario[]>(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());
    const rol = this.filtroRol();
    const estado = this.filtroEstado();

    return this.usuarios().filter((usuario) => {
      const coincideTermino =
        !termino ||
        this.normalizarTexto(usuario.nombre).includes(termino) ||
        this.normalizarTexto(usuario.usuario).includes(termino);

      const coincideRol = rol === 'Todos' || usuario.rol === rol;
      const coincideEstado = estado === 'Todos' || usuario.estado === estado;

      return coincideTermino && coincideRol && coincideEstado;
    });
  });

  protected readonly resumen = computed(() => {
    const cantidad = this.usuariosFiltrados().length;
    return cantidad === 1 ? '1 usuario' : `${cantidad} usuarios`;
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  protected onBuscar(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
  }

  protected onFiltroRol(event: Event): void {
    this.filtroRol.set((event.target as HTMLSelectElement).value as FiltroRol);
  }

  protected onFiltroEstado(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value as FiltroEstado);
  }

  protected iniciarEdicion(usuario: Usuario): void {
    this.usuarioEnEdicionId.set(usuario.id);
    this.errorEdicion.set(null);
    this.form.setValue({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      rol: usuario.rol,
    });
  }

  protected cancelarEdicion(): void {
    this.usuarioEnEdicionId.set(null);
    this.errorEdicion.set(null);
  }

  protected guardarEdicion(): void {
    const id = this.usuarioEnEdicionId();
    if (!id || this.form.invalid || this.guardando()) {
      return;
    }

    const datos = this.form.getRawValue();
    this.guardando.set(true);
    this.errorEdicion.set(null);

    this.usuariosService.actualizar(id, datos).subscribe({
      next: (usuarioActualizado) => {
        this.usuarios.update((lista) => lista.map((u) => (u.id === id ? usuarioActualizado : u)));
        this.usuarioEnEdicionId.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.errorEdicion.set('No fue posible guardar los cambios.');
        this.guardando.set(false);
      },
    });
  }

  protected alternarEstado(usuario: Usuario): void {
    if (this.idsEnCambioEstado().has(usuario.id)) {
      return;
    }

    const nuevoEstado: Usuario['estado'] = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    if (nuevoEstado === 'Inactivo') {
      const confirmado = window.confirm(`¿Deseas desactivar a ${usuario.nombre}?`);
      if (!confirmado) {
        return;
      }
    }

    this.marcarEnCambioEstado(usuario.id, true);
    this.error.set(null);

    this.usuariosService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: (usuarioActualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
        );
        this.marcarEnCambioEstado(usuario.id, false);
      },
      error: () => {
        this.error.set('No fue posible actualizar el estado del usuario.');
        this.marcarEnCambioEstado(usuario.id, false);
      },
    });
  }

  private marcarEnCambioEstado(id: string, enCurso: boolean): void {
    this.idsEnCambioEstado.update((ids) => {
      const copia = new Set(ids);
      if (enCurso) {
        copia.add(id);
      } else {
        copia.delete(id);
      }
      return copia;
    });
  }

  private normalizarTexto(texto: string): string {
    return texto.trim().toLocaleLowerCase();
  }

  private cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el listado de usuarios.');
        this.cargando.set(false);
      },
    });
  }
}
