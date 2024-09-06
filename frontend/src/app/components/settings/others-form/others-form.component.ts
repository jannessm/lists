import { Component, OnDestroy, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';
import { MyMeDocument } from '../../../mydb/types/me';
import { MaterialModule } from '../../../material.module';
import { DateChipSelectComponent } from '../../selects/date-chip-select/date-chip-select.component';
import { ReminderOptionLabels, ReminderOption } from '../../selects/date-chip-select/options';

@Component({
  selector: 'app-settings-others-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    DateChipSelectComponent,
  ],
  templateUrl: './others-form.component.html',
  styleUrls: ['./others-form.component.scss', '../form.scss']
})
export class OthersFormComponent implements OnDestroy {
  user: Signal<MyMeDocument>;

  form: FormGroup;
  formSub: Subscription;

  reminderOptions = ReminderOptionLabels;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.user = this.authService.me;
    const reminder = this.authService.me().defaultReminder || ReminderOption.MIN_0;

    this.form = fb.group({
      'reminder': [reminder]
    });

    this.formSub = this.form.valueChanges.subscribe(() => {
      // push changes
      if (this.user() && this.form.get('reminder')?.value) {
        this.user().patch({
          defaultReminder: this.form.get('reminder')?.value
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
  }
}
