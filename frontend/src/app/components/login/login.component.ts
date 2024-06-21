import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


import md5 from 'md5-ts';

import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form: FormGroup;

  wrongCredentials = false;
  noSpacesRegex = /.*\S.*/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.authService.isLoggedIn.subscribe(loggedIn => {
      if (loggedIn) {
        this.router.navigateByUrl('');
      }
    });

    const nav = this.router.getCurrentNavigation();
    const defaultEmail = nav && nav.extras.state ? nav.extras.state['email'] : '';

    this.form = this.fb.group({
      email: [defaultEmail, [Validators.required, Validators.email]],
      pwd: ['', Validators.required],
    });

    Object.values(this.form.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.wrongCredentials = false)
    );
  }

  login() {
    this.authService.login(
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value)
    ).subscribe(loggedIn => {
      if (!loggedIn) {
        this.wrongCredentials = true;

        Object.values(this.form.controls).forEach(control => {
          control.setErrors({});
        });
      } else {
        this.router.navigateByUrl('/user/lists');
      }
    })
  }

}
