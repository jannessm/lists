import { Component } from '@angular/core';
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

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  form: FormGroup;

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

    this.form = this.fb.group({
      name: [undefined, [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      pwd: ['', Validators.required],
      pwd_confirmation: [undefined, Validators.required],
    },
    {
      validators: MatchValidator('pwd', 'pwd_confirmation')
    });

    Object.values(this.form.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.form.setErrors(null))
    );
  }

  register() {
    this.authService.register(
      (this.form.controls['name'].value as string),
      (this.form.controls['email'].value as string).toLowerCase(),
      md5(this.form.controls['pwd'].value),
      md5(this.form.controls['pwd_confirmation'].value),
    ).subscribe(res => {
      if (res === REGISTER.FOUND) {
        this.form.setErrors({emailOccupied: true});
      } else {
        this.router.navigateByUrl('/login');
      }
    });
    // .subscribe(user => {
    //   // no user data returned === wrong credentials
    //   if (!user) {
    //     this.wrongCredentials = true;

    //     Object.values(this.form.controls).forEach(control => {
    //       control.setErrors({});
    //     });

    //   // login successful => redirect to change-password/previous-url/default page
    //   } else {
    //     if (this.authService.redirectUrl) {
    //       this.router.navigateByUrl(this.authService.redirectUrl);
        
    //     } else {
    //       this.router.navigateByUrl('/user/lists');
    //     }
    //   }
    // })
  }

}
