import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { ArchivosService } from '../../../archivos/services/archivos.service';
import { Archivo } from '../../../archivos/models/archivo.model';
import { MensajesService } from '../../services/mensajes.service';

interface SeleccionArchivo {
  file: File;
  archivoSubido?: Archivo;
}

@Component({
  selector: 'app-redactar-mensaje-page',
  imports: [ReactiveFormsModule],
  templateUrl: './redactar-mensaje-page.html',
  styleUrl: './redactar-mensaje-page.scss',
})
export class RedactarMensajePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly archivosService = inject(ArchivosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly router = inject(Router);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargandoUsuarios = signal(true);
  protected readonly errorUsuarios = signal<string | null>(null);

  protected readonly seleccionArchivos = signal<SeleccionArchivo[]>([]);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    destinatarioIds: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  constructor() {
    this.cargarUsuarios();
  }

  protected onDestinatarioToggle(usuarioId: string, event: Event): void {
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

  protected onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos: SeleccionArchivo[] = Array.from(input.files ?? []).map((file) => ({ file }));
    this.seleccionArchivos.update((actual) => [...actual, ...nuevos]);
    input.value = '';
  }

  protected quitarArchivo(indice: number): void {
    this.seleccionArchivos.update((actual) => actual.filter((_, i) => i !== indice));
  }

  protected tamanoLegible(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
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
        this.mensajesService.crear({ titulo, descripcion, destinatarioIds, archivoIds }),
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
