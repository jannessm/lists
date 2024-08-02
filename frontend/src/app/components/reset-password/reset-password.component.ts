import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { MatchValidator } from '../../../models/match.validators';
import md5 from 'md5-ts';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  token: string | undefined;
  email: string | undefined;

  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];

      if (!this.token || !this.email) {
        const interval = setInterval(() => {
          if (!!this.form) {
            this.form.disable();
            this.form.setErrors({invalidLink: true});
            console.log(this.form.hasError('invalidLink'));
            clearInterval(interval);
          }
        }, 100);
      }
    });

    this.form = fb.group({
      'pwd': ['', Validators.required],
      'pwd_confirmation': ['', Validators.required]
    },
    {
      validators: MatchValidator('pwd', 'pwd_confirmation')
    });

    Object.values(this.form.controls).forEach(control => 
      control.valueChanges.subscribe(() => this.form.setErrors(null))
    );
  }

  resetPwd() {
    if (this.form.invalid) {
      return;
    }

    if (!this.token || !this.email) {
      this.form.setErrors({'invalidLink': true});
    } else {

      const pwd = md5(this.form.get('pwd')?.value);
      const pwd_confirmation = md5(this.form.get('pwd_confirmation')?.value);
  
      this.authService.resetPwd(this.token, this.email, pwd, pwd_confirmation)
        .subscribe(success => {
          if (success) {
            this.router.navigateByUrl('/login');
          } else {
            this.form.setErrors({invalidToken: true});
          }
        });
    
    }
  }


}
