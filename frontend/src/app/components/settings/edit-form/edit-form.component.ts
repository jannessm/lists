import { Component, EventEmitter, Input, OnDestroy, Output, Signal, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MaterialModule } from '../../../material.module';
import { MatchValidator, NoMatchValidator } from '../../../../models/match.validators';
import { MyMeDocument } from '../../../mydb/types/me';
import md5 from 'md5-ts';
import { AuthService } from '../../../services/auth/auth.service';
import { ChangeEmailStatus } from '../../../../models/responses';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.scss', '../form.scss']
})
export class EditFormComponent implements OnDestroy {
  user: Signal<MyMeDocument>;

  @Input() editMode = signal(false);
  @Input() disabled = signal(false);

  @Output() name = new EventEmitter<string>();

  editForm: FormGroup;
  editFormSub: Subscription;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private snackBar: MatSnackBar) {
    this.user = this.authService.me;

    this.editForm = fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      oldPwd: ['', []],
      pwd: ['', []],
      pwdConfirmation: ['', []]
    },
    {
      validators: [
        MatchValidator('pwd', 'pwdConfirmation'),
        NoMatchValidator('oldPwd', 'pwd')
      ]
    });

    this.editFormSub = this.editForm.valueChanges.subscribe(
      () => {
        this.editForm.setErrors(null);
        this.name.emit(this.editForm.get('name')?.value || '');
      }
    );

    effect(() => {
      if (this.editMode() && this.user()) {
        this.editForm.get('name')?.setValue(this.user().name);
        this.editForm.get('email')?.setValue(this.user().email);
      } else {
        this.editForm.reset();
      }

      if (this.disabled()) {
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

  ngOnDestroy(): void {
    this.editFormSub.unsubscribe();
  }

  saveChanges() {
    if (this.editForm.invalid) {
      return;
    }

    const name = this.editForm.get('name')?.value.trim();
    const email = this.editForm.get('email')?.value.trim();
    const oldPwd = this.editForm.get('oldPwd')?.value;
    const pwd = this.editForm.get('pwd')?.value;
    const pwdConfirmation = this.editForm.get('pwdConfirmation')?.value;

    let patch = {};

    if (!!this.user && !!name && !!email && this.editForm.valid) {
      
      this.setName(name);
      this.setEmail(email);
      this.setPwd(oldPwd, pwd, pwdConfirmation);

      this.editMode.set(false);
    } else {
      this.snackBar.open('Name und Email sind fehlerhaft.', 'Ok');
    }
  }

  cancelChanges() {
    this.editMode.set(false);
  }

  setName(name: string) {
    if (this.user.name !== name) {
      this.user().patch({name});
    }
  }

  setEmail(email: string) {
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
  }

  setPwd(oldPwd: string, pwd: string, pwdConfirmation: string) {
    if (!!oldPwd && !!pwd && !!pwdConfirmation && oldPwd !== pwd) {
      this.authService.changePwd(
        md5(oldPwd),
        md5(pwd),
        md5(pwdConfirmation)
      ).subscribe(res => {
        if (res) {
          this.authService.logout();
        } else {
          this.snackBar.open('Passwörter konnten nicht geändert werden.', 'Ok');
        }
      });
    }
  }
}
