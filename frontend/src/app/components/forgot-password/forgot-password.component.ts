import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-forgot-pwd',
    imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule
],
    template: `
      <div style="padding:24px">
        <p>Passwörter werden nicht mehr unterstützt. Melde dich über deine Email-Adresse an.</p>
        <button mat-flat-button color="primary" routerLink="/login">Zum Login</button>
      </div>
    `,
})
export class ForgotPasswordComponent {
  constructor(private router: Router) {
    this.router.navigateByUrl('/login');
  }
}

