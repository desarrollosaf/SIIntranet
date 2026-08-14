import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { CurrentUser } from '../models/current-user.model';
import { API_BASE_URL } from '../http/api.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserSignal = signal<CurrentUser | null>(null);

  readonly currentUser: Signal<CurrentUser | null> = this.currentUserSignal.asReadonly();

  /**
   * Autenticación provisional de desarrollo: usuario/password solo se
   * validan como presentes en el formulario. La identidad real (incluido el
   * rol) la determina exclusivamente el backend mediante su propia
   * identidad de desarrollo (DEV_USER_ID) — este método NO envía usuario ni
   * password al servidor, NO decide el rol localmente y NO consulta
   * ningún endpoint de login real (que todavía no existe, D08). Ambos
   * campos se conservan como interfaz provisional del formulario hasta que
   * exista POST /auth/login real.
   */
  login(usuario: string, password: string): Observable<boolean> {
    if (!usuario.trim() || !password.trim()) {
      return of(false);
    }

    return this.http.get<CurrentUser>(`${API_BASE_URL}/auth/me`).pipe(
      tap((currentUser) => this.currentUserSignal.set(currentUser)),
      map(() => true),
      catchError(() => {
        this.currentUserSignal.set(null);
        return of(false);
      }),
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }
}
