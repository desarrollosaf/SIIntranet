import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import { Archivo } from '../models/archivo.model';

@Injectable({
  providedIn: 'root',
})
export class ArchivosService {
  private readonly http = inject(HttpClient);

  subir(file: File): Observable<Archivo> {
    const formData = new FormData();
    formData.append('archivo', file);

    return this.http.post<Archivo>(`${API_BASE_URL}/archivos`, formData);
  }
}
