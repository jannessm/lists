import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { API_STATUS } from 'src/app/models/api-responses';
import { UserApiService } from 'src/app/services/api/user/user-api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  userEmail: string | undefined;
  version = environment.version;

  theme: FormControl;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {  
    this.userEmail = this.authService.loggedUser?.email;
    const darkTheme = this.authService.loggedUser ? this.authService.loggedUser.dark_theme : null
    this.theme = new FormControl<string>(this.getDarkThemeFormValue(darkTheme));

    this.theme.valueChanges.subscribe(darkTheme => {
      const darkThemeValue = this.getDarkThemeValue(darkTheme);
      if (this.userEmail) {
        this.authService.updateTheme(darkThemeValue).subscribe(new_val => {
          this.theme.setValue(this.getDarkThemeFormValue(new_val), {emitEvent: false});
        });
      }
    });
  }

  getDarkThemeFormValue(darkTheme: boolean | null): string {
    if (darkTheme === null) {
      return 'auto';
    } else if (darkTheme) {
      return 'dark';
    } else {
      return 'light';
    }
  }

  getDarkThemeValue(darkTheme: string): boolean | null {
    if (darkTheme === 'auto') {
      return null;
    } else if (darkTheme === 'light') {
      return false;
    } else {
      return true;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
