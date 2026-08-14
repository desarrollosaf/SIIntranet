import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';

@Component({
  selector: 'app-usuarios-page',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.scss',
})
export class UsuariosPage implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarioEnEdicionId = signal<string | null>(null);
  protected readonly errorEdicion = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    usuario: ['', Validators.required],
    rol: this.formBuilder.nonNullable.control<Usuario['rol']>('Usuario', Validators.required),
  });

  ngOnInit(): void {
    this.cargarUsuarios();
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
    if (!id || this.form.invalid) {
      return;
    }

    const datos = this.form.getRawValue();

    this.usuariosService.actualizar(id, datos).subscribe({
      next: (usuarioActualizado) => {
        this.usuarios.update((lista) => lista.map((u) => (u.id === id ? usuarioActualizado : u)));
        this.usuarioEnEdicionId.set(null);
      },
      error: () => {
        this.errorEdicion.set('No fue posible guardar los cambios.');
      },
    });
  }

  protected alternarEstado(usuario: Usuario): void {
    const nuevoEstado: Usuario['estado'] = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    this.usuariosService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: (usuarioActualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
        );
      },
      error: () => {
        this.error.set('No fue posible actualizar el estado del usuario.');
      },
    });
  }
}
