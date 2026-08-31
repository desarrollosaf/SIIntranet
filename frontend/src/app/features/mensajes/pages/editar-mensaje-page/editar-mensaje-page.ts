import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { ArchivosService } from '../../../archivos/services/archivos.service';
import { Archivo } from '../../../archivos/models/archivo.model';
import { MensajesService } from '../../services/mensajes.service';
import { esMensajeRecibido } from '../../models/mensaje.model';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

interface SeleccionArchivo {
  file: File;
  archivoSubido?: Archivo;
}

@Component({
  selector: 'app-editar-mensaje-page',
  imports: [ReactiveFormsModule, RouterLink, PageHero],
  templateUrl: './editar-mensaje-page.html',
  styleUrl: './editar-mensaje-page.scss',
})
export class EditarMensajePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly archivosService = inject(ArchivosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mensajeId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly editable = signal(false);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargandoUsuarios = signal(true);
  protected readonly errorUsuarios = signal<string | null>(null);

  protected readonly archivoIdsExistentes = signal<string[]>([]);
  protected readonly seleccionArchivos = signal<SeleccionArchivo[]>([]);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    destinatarioIds: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  constructor() {
    this.cargarDetalle();
    this.cargarUsuarios();
  }

  // ===== Selector de destinatarios con búsqueda (ETAPA 15C.3C) =====
  // Misma filosofía UX ya aprobada en Mensaje nuevo: buscador local +
  // disponibles/seleccionados, sin llamadas nuevas al backend por tecla.
  // A diferencia de Redactar (modo respuesta), Editar no tiene un
  // destinatario obligatorio que proteger de quitarDestinatario/
  // limpiarSeleccion.
  protected readonly terminoBusqueda = signal('');

  protected readonly usuariosFiltrados = computed<Usuario[]>(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());

    if (!termino) {
      return this.usuarios();
    }

    return this.usuarios().filter(
      (usuario) =>
        this.normalizarTexto(usuario.nombre).includes(termino) ||
        this.normalizarTexto(usuario.usuario).includes(termino),
    );
  });

  protected onBuscarDestinatarios(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
  }

  protected estaSeleccionado(usuarioId: string): boolean {
    return this.form.controls.destinatarioIds.value.includes(usuarioId);
  }

  // La lista "disponibles" excluye a quienes ya están en Seleccionados, para
  // no duplicar la misma persona en dos listas a la vez.
  protected usuariosDisponibles(): Usuario[] {
    return this.usuariosFiltrados().filter((usuario) => !this.estaSeleccionado(usuario.id));
  }

  protected textoDisponibles(): string {
    return this.conCantidad(this.usuariosDisponibles().length, 'disponible', 'disponibles');
  }

  protected readonly textoAccionSeleccionarTodos = computed(() =>
    this.terminoBusqueda().trim() ? 'Seleccionar resultados' : 'Seleccionar todos',
  );

  protected destinatariosSeleccionados(): Usuario[] {
    const idsSeleccionados = this.form.controls.destinatarioIds.value;
    const usuariosPorId = new Map(this.usuarios().map((usuario) => [usuario.id, usuario]));

    return idsSeleccionados
      .map((id) => usuariosPorId.get(id))
      .filter((usuario): usuario is Usuario => !!usuario);
  }

  protected totalDestinatariosSeleccionados(): number {
    return this.form.controls.destinatarioIds.value.length;
  }

  protected agregarDestinatario(usuarioId: string): void {
    if (this.guardando()) {
      return;
    }

    const actuales = this.form.controls.destinatarioIds.value;

    if (actuales.includes(usuarioId)) {
      return;
    }

    this.form.controls.destinatarioIds.setValue([...actuales, usuarioId]);
    this.form.controls.destinatarioIds.markAsTouched();
  }

  protected quitarDestinatario(usuarioId: string): void {
    if (this.guardando()) {
      return;
    }

    const actuales = this.form.controls.destinatarioIds.value;
    this.form.controls.destinatarioIds.setValue(actuales.filter((id) => id !== usuarioId));
    this.form.controls.destinatarioIds.markAsTouched();
  }

  protected seleccionarResultadosFiltrados(): void {
    if (this.guardando()) {
      return;
    }

    const actuales = this.form.controls.destinatarioIds.value;
    const nuevosIds = this.usuariosFiltrados()
      .map((usuario) => usuario.id)
      .filter((id) => !actuales.includes(id));

    if (nuevosIds.length === 0) {
      return;
    }

    this.form.controls.destinatarioIds.setValue([...actuales, ...nuevosIds]);
    this.form.controls.destinatarioIds.markAsTouched();
  }

  protected limpiarSeleccion(): void {
    if (this.guardando()) {
      return;
    }

    this.form.controls.destinatarioIds.setValue([]);
    this.form.controls.destinatarioIds.markAsTouched();
  }

  protected quitarArchivoExistente(archivoId: string): void {
    if (this.guardando()) {
      return;
    }

    this.archivoIdsExistentes.update((actual) => actual.filter((id) => id !== archivoId));
  }

  protected onArchivosSeleccionados(event: Event): void {
    if (this.guardando()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const nuevos: SeleccionArchivo[] = Array.from(input.files ?? []).map((file) => ({ file }));
    this.seleccionArchivos.update((actual) => [...actual, ...nuevos]);
    input.value = '';
  }

  protected quitarArchivoNuevo(indice: number): void {
    if (this.guardando()) {
      return;
    }

    this.seleccionArchivos.update((actual) => actual.filter((_, i) => i !== indice));
  }

  protected tamanoLegible(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  protected textoContadorArchivosNuevos(): string {
    return this.conCantidad(this.seleccionArchivos().length, 'archivo nuevo', 'archivos nuevos');
  }

  protected textoResumen(): string {
    const destinatarios = this.conCantidad(
      this.totalDestinatariosSeleccionados(),
      'destinatario',
      'destinatarios',
    );
    const totalAdjuntos = this.archivoIdsExistentes().length + this.seleccionArchivos().length;
    const adjuntos = this.conCantidad(totalAdjuntos, 'adjunto', 'adjuntos');

    return `${destinatarios} · ${adjuntos}`;
  }

  private normalizarTexto(texto: string): string {
    return texto.trim().toLowerCase();
  }

  private conCantidad(cantidad: number, singular: string, plural: string): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGuardar.set(null);

    try {
      await this.subirPendientes();
    } catch {
      this.errorGuardar.set('No fue posible subir uno de los archivos seleccionados.');
      this.guardando.set(false);
      return;
    }

    try {
      const { titulo, descripcion, destinatarioIds } = this.form.getRawValue();
      const idsNuevos = this.seleccionArchivos()
        .map((item) => item.archivoSubido?.id)
        .filter((id): id is string => !!id);

      const archivoIds = [...this.archivoIdsExistentes(), ...idsNuevos];

      await firstValueFrom(
        this.mensajesService.actualizar(this.mensajeId, {
          titulo,
          descripcion,
          destinatarioIds,
          archivoIds,
        }),
      );

      this.router.navigateByUrl(`/mensajes/${this.mensajeId}?origen=enviados`);
    } catch {
      this.errorGuardar.set('No fue posible guardar los cambios. Puedes intentarlo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  private cargarDetalle(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.mensajesService.obtenerDetalle(this.mensajeId).subscribe({
      next: (detalle) => {
        if (esMensajeRecibido(detalle)) {
          this.error.set('Este mensaje no puede editarse.');
          this.cargando.set(false);
          return;
        }

        const esEditable =
          detalle.estado === 'Enviado' && detalle.destinatarios.every((d) => d.estadoLectura === 'Nuevo');

        if (!esEditable) {
          this.error.set('Este mensaje ya no puede editarse.');
          this.cargando.set(false);
          return;
        }

        this.editable.set(true);
        this.form.setValue({
          titulo: detalle.titulo ?? '',
          descripcion: detalle.descripcion ?? '',
          destinatarioIds: detalle.destinatarios.map((d) => d.usuarioId),
        });
        this.archivoIdsExistentes.set(detalle.archivoIds ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el mensaje.');
        this.cargando.set(false);
      },
    });
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.errorUsuarios.set(null);

    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargandoUsuarios.set(false);
      },
      error: () => {
        this.errorUsuarios.set('No fue posible cargar el listado de usuarios.');
        this.cargandoUsuarios.set(false);
      },
    });
  }

  private async subirPendientes(): Promise<void> {
    const seleccion = this.seleccionArchivos();

    for (let indice = 0; indice < seleccion.length; indice++) {
      if (seleccion[indice].archivoSubido) {
        continue;
      }

      const archivoSubido = await firstValueFrom(this.archivosService.subir(seleccion[indice].file));

      this.seleccionArchivos.update((actual) =>
        actual.map((item, i) => (i === indice ? { ...item, archivoSubido } : item)),
      );
    }
  }
}
