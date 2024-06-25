import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { DataService } from '../../services/data/data.service';
import { User } from '../../../models/rxdb/me';
import { RxDocument } from 'rxdb';
import { ThemeService } from '../../services/theme/theme.service';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MaterialModule,
    NameBadgePipe
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  user?: RxDocument<User>;
  version = environment.version;

  theme: FormControl;

  editMode = false;
  nameEmailForm: FormGroup;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private dataService: DataService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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
          theme
        });

        // update theme
        this.themeService.updateTheme(theme);
      }
    });

    this.nameEmailForm = fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  enterEditMode() {
    this.nameEmailForm.get('name')?.setValue(this.user?.get('name'));
    this.nameEmailForm.get('email')?.setValue(this.user?.get('email'));

    this.editMode = true;
  }

  saveNameEmail() {
    const name = this.nameEmailForm.get('name')?.value;
    const email = this.nameEmailForm.get('email')?.value;

    let patch = {};

    if (!!this.user && !!name && !!email && this.nameEmailForm.valid) {
      if (this.user.name !== name) {
        patch = Object.assign(patch, {name});
      }

      if (this.user.email !== email) {
        patch = Object.assign(patch, {email, emailVerifiedAt: null});
      }

      if (Object.keys(patch).length > 0) {
        this.user.patch(patch);
      }

      this.editMode = false;
    } else {
      this.snackBar.open('Name und Email sind fehlerhaft.', 'Ok');
    }
  }

}
