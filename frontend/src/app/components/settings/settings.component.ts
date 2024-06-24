import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { DataService } from '../../services/data/data.service';
import { User } from '../../../models/rxdb/me';
import { BehaviorSubject, map } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MaterialModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  user?: BehaviorSubject<User>;
  version = environment.version;

  theme: FormControl;
  pushSubscription?: FormControl;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private swPush: SwPush
  ) {
    this.dataService.dbInitialized.subscribe(initialized => {
      if (initialized) {
        if (this.dataService.db && this.dataService.db['me']) {
          this.user = this.dataService.db['me'].find()
                        .where('updatedAt').gte('0').$
                        .pipe(map(arr => arr[0])) as BehaviorSubject<User>;
        }
      }
    });
    const darkTheme = null;
    this.theme = new FormControl<string>(this.getDarkThemeFormValue(darkTheme));
    // this.pushSubscription = new FormControl<boolean>(this.authService.loggedUser?.subscription || false);

    this.theme.valueChanges.subscribe(darkTheme => {
      const darkThemeValue = this.getDarkThemeValue(darkTheme);
      // if (this.userEmail) {
      //   this.authService.updateTheme(darkThemeValue).subscribe(new_val => {
      //     this.theme.setValue(this.getDarkThemeFormValue(new_val), {emitEvent: false});
      //   });
      // }
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
