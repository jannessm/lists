import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-verify-code',
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './verify-code.component.html',
  styleUrls: ['./verify-code.component.scss'],
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  form: FormGroup;
  formSub: Subscription | undefined;

  errorMessage = signal<string | null>(null);
  resendCooldown = signal(0);
  isSubmitting = signal(false);

  private cooldownTimer: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    // Redirect back to login if there is no pending email
    if (!this.authService.pendingEmail()) {
      this.router.navigateByUrl('/login');
    }

    this.formSub = this.form.valueChanges.subscribe(() => {
      this.errorMessage.set(null);
      const code: string = (this.form.get('code')?.value ?? '').toUpperCase();
      if (code.length === 6 && this.form.valid) {
        this.submit();
      }
    });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const code = (this.form.get('code')?.value as string).toUpperCase();

    this.authService.verifyCode(code).subscribe(res => {
      this.isSubmitting.set(false);

      if (!res.success) {
        const msg = res.error === 'too_many_attempts'
          ? 'Zu viele Fehlversuche. Bitte neu anmelden.'
          : 'Ungültiger Code. Bitte erneut versuchen.';
        this.errorMessage.set(msg);
        this.form.get('code')?.setValue('');

        if (res.error === 'too_many_attempts') {
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  resend(): void {
    if (this.resendCooldown() > 0) return;

    this.authService.resendCode().subscribe(ok => {
      if (ok) {
        this.startCooldown(60);
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownTimer);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  get pendingEmail(): string | null {
    return this.authService.pendingEmail();
  }
}
