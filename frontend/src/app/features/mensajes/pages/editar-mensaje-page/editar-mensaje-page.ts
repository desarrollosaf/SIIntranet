import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { ArchivosService } from '../../../archivos/services/archivos.service';
import { Archivo } from '../../../archivos/models/archivo.model';
import { MensajesService } from '../../services/mensajes.service';
import { esMensajeRecibido } from '../../models/mensaje.model';

interface SeleccionArchivo {
  file: File;
  archivoSubido?: Archivo;
}

@Component({
  selector: 'app-editar-mensaje-page',
  imports: [ReactiveFormsModule, RouterLink],
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

  private readonly mensajeId = this.route.snapshot.paramMap.get('id') ?? '';

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

  protected onDestinatarioToggle(usuarioId: string, event: Event): void {
    if (this.guardando()) {
      return;
    }

    const marcado = (event.target as HTMLInputElement).checked;
    const actuales = this.form.controls.destinatarioIds.value;

    const nuevos = marcado
      ? actuales.includes(usuarioId)
        ? actuales
        : [...actuales, usuarioId]
      : actuales.filter((id) => id !== usuarioId);

    this.form.controls.destinatarioIds.setValue(nuevos);
    this.form.controls.destinatarioIds.markAsTouched();
  }

  protected estaSeleccionado(usuarioId: string): boolean {
    return this.form.controls.destinatarioIds.value.includes(usuarioId);
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

      this.router.navigateByUrl(`/mensajes/${this.mensajeId}`);
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
