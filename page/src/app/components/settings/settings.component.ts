import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  userEmail: string | undefined;
  version = environment.version;

  constructor(private authService: AuthService, private router: Router) {
    this.userEmail = this.authService.loggedUser?.email;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
