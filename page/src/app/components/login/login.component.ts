import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form: FormGroup;

  wrongCredentials = false;

  constructor(private fb: FormBuilder) {
    this.form = fb.group({
      email: ['', Validators.required],
      pwd: ['', Validators.required]
    });

    this.form.controls['email'].valueChanges.subscribe(() => this.form.controls['pwd'].setErrors(null));
    this.form.controls['pwd'].valueChanges.subscribe(() => this.form.controls['email'].setErrors(null));

    Object.values(this.form.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.wrongCredentials = false)
    );
  }

  login() {

  }

}
