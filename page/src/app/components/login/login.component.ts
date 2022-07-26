import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import md5 from 'md5-ts';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form: FormGroup;

  wrongCredentials = false;
  noSpacesRegex = /.*\S.*/;
  showCaptcha = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = fb.group({
      email: [undefined, [Validators.required, Validators.email]],
      pwd: [undefined, Validators.required]
    });

    Object.values(this.form.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.wrongCredentials = false)
    );
  }

  login() {
    this.authService.login(
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value)
    ).subscribe(user => {
      // no user data returned === wrong credentials
      if (!user) {
        this.wrongCredentials = true;

        Object.values(this.form.controls).forEach(control => {
          control.setErrors({});
        });

      // login successful => redirect to change-password/previous-url/default page
      } else {
        if (this.authService.redirectUrl) {
          this.router.navigateByUrl(this.authService.redirectUrl);
        
        } else {
          this.router.navigateByUrl('/user/lists');
        }
      }
    })
  }

  register() {
    this.authService.register(
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value)
    ).subscribe(user => {
      // no user data returned === wrong credentials
      if (!user) {
        this.wrongCredentials = true;

        Object.values(this.form.controls).forEach(control => {
          control.setErrors({});
        });

      // login successful => redirect to change-password/previous-url/default page
      } else {
        if (this.authService.redirectUrl) {
          this.router.navigateByUrl(this.authService.redirectUrl);
        
        } else {
          this.router.navigateByUrl('/user/lists');
        }
      }
    })
  }

  registerCaptchaFailed() {
    this.snackBar.open("Captcha fehlgeschlagen. Keine Registrierung möglich", "Ok");
  }

}
