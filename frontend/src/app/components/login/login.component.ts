import { Component, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


import md5 from 'md5-ts';

import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HCaptchaComponent } from '../hcaptcha/hcaptcha.component';
import { Subscription } from 'rxjs';

declare const window: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    HCaptchaComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {

  form: FormGroup;
  formSub: Subscription;

  wrongCredentials = false;
  noSpacesRegex = /.*\S.*/;
  initCaptcha = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      pwd: ['', Validators.required],
      captcha: ['', Validators.required]
    });

    this.formSub = this.form.valueChanges.subscribe(() => {
      this.resetErrors();
    });
  }

  ngAfterViewInit() {
    this.initCaptcha.set(true);
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
    this.authService.login(
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value),
      this.form.controls['captcha'].value
    ).subscribe(loggedIn => {
      if (!loggedIn) {
        this.wrongCredentials = true;

        Object.values(this.form.controls).forEach(control => {
          control.setErrors({'wrongCredentials': true});
        });

        window.hcaptcha.reset();
      }
    })
  }

  captchaVerify(res: string) {
    this.form.get('captcha')?.setErrors(null);
    this.form.get('captcha')?.setValue(res);
  }

  captchaError() {
    this.form.get('captcha')?.setErrors({'captcha': true});
  }

}
