import { Component, OnDestroy, Signal, effect } from '@angular/core';
import { ThemeService } from '../../../services/theme/theme.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';
import { MyMeDocument } from '../../../mydb/types/me';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-settings-theme-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './theme-form.component.html',
  styleUrls: ['./theme-form.component.scss', '../form.scss']
})
export class ThemeFormComponent implements OnDestroy {
  user: Signal<MyMeDocument>;

  theme: FormControl;
  themeSub: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService
  ) {
    this.user = this.authService.me as Signal<MyMeDocument>;

    this.theme = new FormControl<string>('');

    effect(() => {
      const pref = this.themeService.userPreference();
      if (pref) {
        this.theme.setValue(pref, {emitEvent: false});
      }
    });

    this.themeSub = this.theme.valueChanges.subscribe(theme => {
      // push changes
      if (this.user()) {
        this.user().patch({
          theme
        });

        // update theme
        this.themeService.updateTheme(theme);
      }
    });
  }

  ngOnDestroy(): void {
    this.themeSub.unsubscribe();
  }
}
