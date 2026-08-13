import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-inicio-page',
  imports: [],
  templateUrl: './inicio-page.html',
  styleUrl: './inicio-page.scss',
})
export class InicioPage {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
}
