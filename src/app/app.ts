import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  moduloActual = 'inicio';

  cambiarModulo(modulo: string): void {
    this.moduloActual = modulo;
  }

  get tituloModulo(): string {

    switch (this.moduloActual) {

      case 'mensaje':
        return 'Mensaje nuevo';

      case 'bandeja':
        return 'Bandeja de entrada';

      case 'formatos':
        return 'Formatos';

      case 'administracion':
        return 'Administración';

      default:
        return 'Inicio';
    }
  }

  get descripcionModulo(): string {

    switch (this.moduloActual) {

      case 'mensaje':
        return 'Registro y envío de documentos internos';

      case 'bandeja':
        return 'Consulta de mensajes y documentos recibidos';

      case 'formatos':
        return 'Consulta de formatos y manuales institucionales';

      case 'administracion':
        return 'Gestión administrativa del sistema';

      default:
        return 'Sistema interno de gestión documental';
    }
  }

}