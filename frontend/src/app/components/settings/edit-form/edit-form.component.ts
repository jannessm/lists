import { Component, EventEmitter, Input, OnDestroy, Output, Signal, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MaterialModule } from '../../../material.module';
import { MyMeDocument } from '../../../mydb/types/me';
import { AuthService } from '../../../services/auth/auth.service';
import { ChangeEmailStatus } from '../../../../models/responses';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
    selector: 'app-settings-edit-form',
    imports: [
    ReactiveFormsModule,
    MaterialModule
],
    templateUrl: './edit-form.component.html',
    styleUrls: ['./edit-form.component.scss', '../form.scss']
})
export class EditFormComponent implements OnDestroy {
  user: Signal<MyMeDocument | undefined>;

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
    });

    this.editFormSub = this.editForm.valueChanges.subscribe(
      () => {
        this.editForm.setErrors(null);
        this.name.emit(this.editForm.get('name')?.value || '');
      }
    );

    effect(() => {
      const user = this.user()
      if (this.editMode() && user) {
        this.editForm.get('name')?.setValue(user.name);
        this.editForm.get('email')?.setValue(user.email);
      } else {
        this.editForm.reset();
      }

      if (this.disabled()) {
        this.editForm.get('email')?.disable();
      } else {
        this.editForm.get('email')?.enable();
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

    if (!!this.user && !!name && !!email && this.editForm.valid) {
      this.setName(name);
      this.setEmail(email);
      this.editMode.set(false);
    } else {
      this.snackBar.open('Name und Email sind fehlerhaft.', 'Ok');
    }
  }

  cancelChanges() {
    this.editMode.set(false);
  }

  setName(name: string) {
    const user = this.user();
    if (!!user && user.name !== name) {
      user.patch({name});
    }
  }

  setEmail(email: string) {
    const user = this.user();
    if (user && user.email !== email) {
      this.authService.changeEmail(email).subscribe(res => {
        if (user) {
          if (res === ChangeEmailStatus.EMAIL_ALREADY_USED) {
            this.snackBar.open('Emailadresse wird bereits verwendet. Bitte wähle eine andere!', 'Ok');
          } else if (res === ChangeEmailStatus.ERROR) {
            this.snackBar.open('Email konnte nicht geändert werden.', 'Ok');
          } else {
            this.snackBar.open('Ein Login-Code wurde an die neue Email-Adresse gesendet.', 'Ok');
            user.patch({
              email,
              emailVerifiedAt: null
            });
          }
        }
      });
    }
  }
}

