import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    // Check if code and email are provided in URL (from magic link)
    const urlCode = this.route.snapshot.queryParamMap.get('code');
    const urlEmail = this.route.snapshot.queryParamMap.get('email');

    if (urlCode && urlEmail) {
      // Set the pending email if coming from magic link
      this.authService.pendingEmail.set(urlEmail);
      // Auto-fill and submit the code
      this.form.get('code')?.setValue(urlCode.toUpperCase());
      // Submit immediately if valid
      if (this.form.valid) {
        this.submit();
      }
      return;
    }

    // Redirect back to login if there is no pending email and no URL params
    if (!this.authService.pendingEmail()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.formSub = this.form.valueChanges.subscribe(() => {
      // Clear errors only when user starts typing (not when field is cleared programmatically)
      const code: string = (this.form.get('code')?.value ?? '').toUpperCase();
      
      if (code.length > 0) {
        this.errorMessage.set(null);
        this.form.get('code')?.setErrors(null);
      }
      
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
        if (res.error === 'too_many_attempts') {
          this.errorMessage.set('Zu viele Fehlversuche. Bitte neu anmelden.');
          this.form.get('code')?.setErrors({ tooManyAttempts: true });
          this.form.get('code')?.markAsTouched();
          this.router.navigateByUrl('/login');
        } else {
          this.errorMessage.set('Ungültiger Code. Bitte erneut versuchen.');
          this.form.get('code')?.setErrors({ invalidCode: true });
          this.form.get('code')?.markAsTouched();
          // Delay clearing the field so error is visible
          setTimeout(() => {
            this.form.get('code')?.setValue('', { emitEvent: false });
          }, 100);
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
