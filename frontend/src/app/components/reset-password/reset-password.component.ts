import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { MatchValidator } from '../../../models/match.validators';
import md5 from 'md5-ts';
import { Subscription } from 'rxjs';

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
export class ResetPasswordComponent implements OnDestroy {
  token: string | undefined;
  email: string | undefined;

  form: FormGroup;
  formSub: Subscription;

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

    this.formSub = this.form.valueChanges.subscribe(() => {
      this.form.setErrors(null);
    });
  }

  ngOnDestroy(): void {
      this.formSub.unsubscribe();
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
