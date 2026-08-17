import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import {
  CrearMensajeDatos,
  MensajeCreado,
  MensajeDetalle,
  MensajeEnviado,
  MensajeRecibido,
} from '../models/mensaje.model';

@Injectable({
  providedIn: 'root',
})
export class MensajesService {
  private readonly http = inject(HttpClient);

  recibidos(): Observable<MensajeRecibido[]> {
    return this.http.get<MensajeRecibido[]>(`${API_BASE_URL}/mensajes/recibidos`);
  }

  enviados(): Observable<MensajeEnviado[]> {
    return this.http.get<MensajeEnviado[]>(`${API_BASE_URL}/mensajes/enviados`);
  }

  obtenerDetalle(id: string): Observable<MensajeDetalle> {
    return this.http.get<MensajeDetalle>(`${API_BASE_URL}/mensajes/${id}`);
  }

  crear(datos: CrearMensajeDatos): Observable<MensajeCreado> {
    return this.http.post<MensajeCreado>(`${API_BASE_URL}/mensajes`, datos);
  }

  marcarVisto(id: string): Observable<unknown> {
    return this.http.patch(`${API_BASE_URL}/mensajes/${id}/visto`, {});
  }

  urlDescargaAdjunto(mensajeId: string, archivoId: string): string {
    return `${API_BASE_URL}/mensajes/${mensajeId}/adjuntos/${archivoId}/descarga`;
  }
}
