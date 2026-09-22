import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import { Formato } from '../models/formato.model';

@Injectable({
  providedIn: 'root',
})
export class FormatosService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Formato[]> {
    return this.http.get<Formato[]>(`${API_BASE_URL}/formatos`);
  }

  urlDescarga(id: string): string {
    return `${API_BASE_URL}/formatos/${id}/descarga`;
  }
}
