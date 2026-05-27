import { Component, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../services/auth/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-login',
    imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {

  form: FormGroup;
  formSub: Subscription;

  wrongCredentials = false;
  noSpacesRegex = /.*\S.*/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.formSub = this.form.valueChanges.subscribe(() => {
      this.resetErrors();
    });
  }

  ngOnDestroy() {
    this.formSub.unsubscribe();
  }

  resetErrors() {
    if (this.wrongCredentials) {
      this.wrongCredentials = false;
      Object.values(this.form.controls).forEach(control => {
        control.setErrors(null);
        control.updateValueAndValidity();
      });
    }
  }

  login() {
    if (this.form.invalid) return;

    this.authService.login(
      (this.form.controls['email'].value as string).toLowerCase(),
    ).subscribe(result => {
      if (result === false) {
        this.wrongCredentials = true;
        Object.values(this.form.controls).forEach(control => {
          control.setErrors({'wrongCredentials': true});
        });
      }
    });
  }

}

