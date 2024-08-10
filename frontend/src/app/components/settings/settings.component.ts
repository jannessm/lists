import { CommonModule } from '@angular/common';
import { Component, Signal, effect } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { DataService } from '../../services/data/data.service';
import { MyMeDocument } from '../../mydb/types/me';
import { ThemeService } from '../../services/theme/theme.service';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChangeEmailStatus } from '../../../models/responses';
import { PusherService } from '../../services/pusher/pusher.service';
import { MatchValidator, NoMatchValidator } from '../../../models/match.validators';
import md5 from 'md5-ts';

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
  user: Signal<MyMeDocument>;
  version = environment.version;

  theme: FormControl;
  defaultList: FormControl;

  editMode = false;
  editForm: FormGroup;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private dataService: DataService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public pusher: PusherService,
  ) {
    this.user = this.authService.me;
    this.theme = new FormControl<string>('auto');
    this.defaultList = new FormControl<string>('null');

    this.theme.valueChanges.subscribe(theme => {
      // push changes
      if (this.user()) {
        this.user().patch({
          theme
        });

        // update theme
        this.themeService.updateTheme(theme);
      }
    });

    // this.defaultList.valueChanges.subscribe(listId => {
    //   if (listId === 'null') {
    //     listId = null;
    //   }
      
    //   if (this.user && listId !== this.user().defaultList) {
    //     this.user().patch({
    //       defaultList: listId
    //     });
    //   }
    // })

    this.editForm = fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      oldPwd: ['', []],
      pwd: ['', []],
      pwdConfirmation: ['', []]
    },
    {
      validators: [MatchValidator('pwd', 'pwdConfirmation'), NoMatchValidator('oldPwd', 'pwd')]
    });

    Object.values(this.editForm.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.editForm.setErrors(null))
    );

    this.pusher.online.subscribe(isOnline => {
      if (!isOnline) {
        this.editForm.get('email')?.disable();
        this.editForm.get('oldPwd')?.disable();
        this.editForm.get('pwd')?.disable();
        this.editForm.get('pwdConfirmation')?.disable();
      } else {
        this.editForm.get('email')?.enable();
        this.editForm.get('oldPwd')?.enable();
        this.editForm.get('pwd')?.enable();
        this.editForm.get('pwdConfirmation')?.enable();
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  enterEditMode() {
    if (this.user) {
      this.editForm.get('name')?.setValue(this.user().name);
      this.editForm.get('email')?.setValue(this.user().email);
      this.editForm.get('oldPwd')?.setValue('');
      this.editForm.get('pwd')?.setValue('');
      this.editForm.get('pwdConfirmation')?.setValue('');
    }

    this.editMode = true;
  }

  cancelChanges() {
    this.editForm.reset();
    this.editMode = false;
  }

  saveChanges() {
    if (this.editForm.invalid) {
      return;
    }

    const name = this.editForm.get('name')?.value;
    const email = this.editForm.get('email')?.value;
    const oldPwd = md5(this.editForm.get('oldPwd')?.value);
    const pwd = md5(this.editForm.get('pwd')?.value);
    const pwdConfirmation = md5(this.editForm.get('pwdConfirmation')?.value);

    let patch = {};

    if (!!this.user && !!name && !!email && this.editForm.valid) {
      
      // username
      if (this.user.name !== name) {
        patch = Object.assign(patch, {name});
      }


      // email
      if (this.user && this.user().email !== email) {
        this.authService.changeEmail(email).subscribe(res => {
          if (this.user) {
            if (res === ChangeEmailStatus.EMAIL_ALREADY_USED) {
              this.snackBar.open('Emailadresse wird bereits verwendet. Bitte wähle eine andere!', 'Ok');
            } else if (res === ChangeEmailStatus.ERROR) {
              this.snackBar.open('Email konnte nicht geändert werden.', 'Ok');
            } else {
              this.snackBar.open('Bestätige deine neue Emailadresse per Link in der Bestätigungsmail.', 'Ok');
              this.user().patch({
                email,
                emailVerifiedAt: null
              });
            }
          }
        });
      }


      // pwd
      if (!!oldPwd && !!pwd && !!pwdConfirmation && oldPwd !== pwd) {
        this.authService.changePwd(oldPwd, pwd, pwdConfirmation).subscribe(res => {
          if (res) {
            this.authService.logout();
          } else {
            this.snackBar.open('Passwörter konnten nicht geändert werden.', 'Ok');
          }
        });
      }

      if (Object.keys(patch).length > 0) {
        this.user().patch(patch);
      }

      this.editMode = false;
    } else {
      this.snackBar.open('Name und Email sind fehlerhaft.', 'Ok');
    }
  }

}
