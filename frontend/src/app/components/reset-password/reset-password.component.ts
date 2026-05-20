import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-reset-password',
    imports: [RouterModule],
    template: ``,
})
export class ResetPasswordComponent implements OnDestroy {
  constructor(private router: Router) {
    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {}
}

