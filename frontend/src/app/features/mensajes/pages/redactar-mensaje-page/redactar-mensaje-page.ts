import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-redactar-mensaje-page',
  imports: [ReactiveFormsModule, PageHero],
  templateUrl: './redactar-mensaje-page.html',
  styleUrl: './redactar-mensaje-page.scss',
})
export class RedactarMensajePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly archivosService = inject(ArchivosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargandoUsuarios = signal(true);
  protected readonly errorUsuarios = signal<string | null>(null);

  protected readonly seleccionArchivos = signal<SeleccionArchivo[]>([]);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly modoRespuesta = signal(false);
  protected readonly cargandoOriginal = signal(false);
  protected readonly errorOriginal = signal<string | null>(null);
  protected readonly remitenteOriginalId = signal<string | null>(null);

  protected readonly tituloHero = computed(() =>
    this.modoRespuesta() ? 'Responder mensaje' : 'Mensaje nuevo',
  );
  protected readonly iconoHero = computed(() =>
    this.modoRespuesta() ? 'bi-reply' : 'bi-pencil-square',
  );

  private respuestaAId: string | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    destinatarioIds: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.modoRespuesta.set(true);
      this.respuestaAId = id;
      this.cargarOriginal(id);
    }

    this.cargarUsuarios();
  }

  protected onDestinatarioToggle(usuarioId: string, event: Event): void {
    if (this.enviando() || this.esRemitenteOriginal(usuarioId)) {
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

  protected esRemitenteOriginal(usuarioId: string): boolean {
    return this.modoRespuesta() && usuarioId === this.remitenteOriginalId();
  }

  protected puedeResponder(): boolean {
    return !this.cargandoOriginal() && !this.errorOriginal() && this.remitenteOriginalId() !== null;
  }

  protected onArchivosSeleccionados(event: Event): void {
    if (this.enviando()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const nuevos: SeleccionArchivo[] = Array.from(input.files ?? []).map((file) => ({ file }));
    this.seleccionArchivos.update((actual) => [...actual, ...nuevos]);
    input.value = '';
  }

  protected quitarArchivo(indice: number): void {
    if (this.enviando()) {
      return;
    }

    this.seleccionArchivos.update((actual) => actual.filter((_, i) => i !== indice));
  }

  protected tamanoLegible(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  protected async onSubmit(): Promise<void> {
    if (
      this.form.invalid ||
      this.enviando() ||
      (this.modoRespuesta() && !this.puedeResponder())
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    try {
      await this.subirPendientes();
    } catch {
      this.error.set('No fue posible subir uno de los archivos seleccionados.');
      this.enviando.set(false);
      return;
    }

    try {
      const { titulo, descripcion, destinatarioIds } = this.form.getRawValue();
      const archivoIds = this.seleccionArchivos()
        .map((item) => item.archivoSubido?.id)
        .filter((id): id is string => !!id);

      await firstValueFrom(
        this.mensajesService.crear({
          titulo,
          descripcion,
          destinatarioIds,
          archivoIds,
          ...(this.respuestaAId ? { respuestaAId: this.respuestaAId } : {}),
        }),
      );

      this.router.navigateByUrl('/mensajes/enviados');
    } catch {
      this.error.set('No fue posible enviar el mensaje. Puedes intentarlo de nuevo.');
    } finally {
      this.enviando.set(false);
    }
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

  private cargarOriginal(id: string): void {
    this.cargandoOriginal.set(true);
    this.errorOriginal.set(null);

    this.mensajesService.obtenerDetalle(id).subscribe({
      next: (original) => {
        if (!esMensajeRecibido(original) || original.estado !== 'Enviado' || !original.contenidoDisponible) {
          this.errorOriginal.set('Este mensaje no admite respuestas.');
          this.cargandoOriginal.set(false);
          return;
        }

        this.remitenteOriginalId.set(original.remitente.id);
        this.agregarDestinatarioObligatorio(original.remitente.id);
        this.cargandoOriginal.set(false);
      },
      error: () => {
        this.errorOriginal.set('No fue posible cargar el mensaje original.');
        this.cargandoOriginal.set(false);
      },
    });
  }

  private agregarDestinatarioObligatorio(usuarioId: string): void {
    const actuales = this.form.controls.destinatarioIds.value;

    if (!actuales.includes(usuarioId)) {
      this.form.controls.destinatarioIds.setValue([...actuales, usuarioId]);
    }
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
