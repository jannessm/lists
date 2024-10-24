import { Component, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


import md5 from 'md5-ts';

import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatchValidator } from '../../../models/match.validators';
import { REGISTER } from '../../globals';
import { MatIconModule } from '@angular/material/icon';
import { HCaptchaComponent } from '../hcaptcha/hcaptcha.component';
import { Subscription } from 'rxjs';

declare const window: any;

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnDestroy {

  form: FormGroup;
  fromSub: Subscription;
  
  noSpacesRegex = /.*\S.*/;
  initCaptcha = signal(false);
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      pwd: ['', Validators.required],
      pwd_confirmation: ['', Validators.required],
      captcha: ['', Validators.required]
    },
    {
      validators: MatchValidator('pwd', 'pwd_confirmation')
    });

    this.fromSub = this.form.valueChanges.subscribe(() => {
      this.form.setErrors(null);
    });
  }

  ngAfterViewInit() {
    this.initCaptcha.set(true);
  }

  ngOnDestroy(): void {
      this.fromSub.unsubscribe();
  }

  register() {
    this.authService.register(
      (this.form.controls['name'].value as string),
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value),
      md5(this.form.controls['pwd_confirmation'].value),
      this.form.controls['captcha'].value
    ).subscribe(res => {
      if (res == REGISTER.FOUND) {
        this.form.get('email')?.setErrors({emailOccupied: true});
        window.hcaptcha.reset();
      } else if (res == REGISTER.ERROR) {
        this.form.setErrors({'error': true});
        window.hcaptcha.reset();
      }
    });
  }

  captchaVerify(res: string) {
    this.form.get('captcha')?.setErrors(null);
    this.form.get('captcha')?.setValue(res);
  }

  captchaError() {
    this.form.get('captcha')?.setErrors({'captcha': true});
  }
}
