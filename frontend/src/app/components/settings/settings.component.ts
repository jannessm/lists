import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { DataService } from '../../services/data/data.service';
import { THEME, User } from '../../../models/rxdb/me';
import { RxDocument } from 'rxdb';
import { Observable } from 'rxjs';
import { ThemeService } from '../../services/theme/theme.service';

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
  user?: RxDocument<User>;
  version = environment.version;

  theme: FormControl;
  pushSubscription?: FormControl;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private dataService: DataService,
    private router: Router,
    private swPush: SwPush
  ) {
    this.dataService.dbInitialized.subscribe(initialized => {
      if (initialized) {
        if (this.dataService.db && this.dataService.db['me']) {
          // subscribe to RxDocument to get updates and immediately apply them
          this.dataService.db['me'].find().exec()
            .then((docs: RxDocument<User>[]) => {
              docs[0].$.subscribe(user => {
                this.user = user;
  
                // update FormControls on changes
                this.theme.setValue(this.user?.get('theme'), {emitEvent: false});
              });
            });
        }
      }
    });
    this.theme = new FormControl<string>('auto');

    this.theme.valueChanges.subscribe(theme => {
      // push changes
      if (this.user) {
        this.user.patch({
        // this.user.patch({
          theme
        });

        // update theme
        this.themeService.updateTheme(theme);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
