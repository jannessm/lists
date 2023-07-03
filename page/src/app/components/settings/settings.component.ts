import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { catchError, of } from 'rxjs';
import { UserApiService } from 'src/app/services/api/user/user-api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  userEmail: string;
  version = environment.version;

  theme: FormControl;
  pushSubscription: FormControl;

  constructor(
    private authService: AuthService, 
    private userApi: UserApiService,
    private router: Router,
    private swPush: SwPush
  ) {
    this.userEmail = this.authService.loggedUser?.email || '';
    const darkTheme = this.authService.loggedUser ? this.authService.loggedUser.dark_theme : null
    this.theme = new FormControl<string>(this.getDarkThemeFormValue(darkTheme));
    this.pushSubscription = new FormControl<boolean>(this.authService.loggedUser?.subscription || false);

    this.theme.valueChanges.subscribe(darkTheme => {
      const darkThemeValue = this.getDarkThemeValue(darkTheme);
      if (this.userEmail) {
        this.authService.updateTheme(darkThemeValue).subscribe(new_val => {
          this.theme.setValue(this.getDarkThemeFormValue(new_val), {emitEvent: false});
        });
      }
    });

    this.pushSubscription.valueChanges.subscribe(push_enabled => {

      // const swsub = this.swPush.subscription.subscribe(sub => {
      //   console.log(push_enabled, sub);

        if (!push_enabled) {
          this.userApi.removePushSubscriber(this.userEmail).subscribe(console.log);
        }

        if (push_enabled) {
        // if (push_enabled && !sub) {
          this.swPush.requestSubscription({
            serverPublicKey: environment.vapid
          })
          .then(sub => this.userApi.addPushSubscriber(this.userEmail, sub).subscribe())
          .catch(err => console.error("Could not subscribe to notifications", err));
        } else if (!push_enabled) {
        // } else if (!push_enabled && sub) {
          this.swPush.unsubscribe().then(console.log);
        }
      });

      // setTimeout(() => {swsub.unsubscribe()}, 100);
    // });
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
