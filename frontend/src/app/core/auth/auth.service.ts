import { Injectable, Signal, signal } from '@angular/core';
import { CurrentUser } from '../models/current-user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSignal = signal<CurrentUser | null>(null);

  readonly currentUser: Signal<CurrentUser | null> = this.currentUserSignal.asReadonly();

  /**
   * Autenticación provisional de desarrollo: valida únicamente presencia de
   * usuario/contraseña, no consulta backend ni almacena la contraseña.
   * Debe sustituirse por integración HTTP real.
   */
  login(usuario: string, password: string): boolean {
    if (!usuario.trim() || !password.trim()) {
      return false;
    }

    this.currentUserSignal.set({
      nombre: usuario.trim(),
      rol: 'Usuario',
    });

    return true;
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }
}
