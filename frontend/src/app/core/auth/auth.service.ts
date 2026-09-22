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
