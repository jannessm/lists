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
import { MatIconModule } from '@angular/material/icon';

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
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  form: FormGroup;

  noSpacesRegex = /.*\S.*/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      pwd: ['', Validators.required],
      pwd_confirmation: ['', Validators.required],
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
      console.log(res, REGISTER.FOUND, REGISTER.FOUND.valueOf());
      if (res == REGISTER.FOUND) {
        this.form.get('email')?.setErrors({emailOccupied: true});
      } else if (res == REGISTER.ERROR) {
        this.form.setErrors({'error': true});
      }
    });
  }

}
