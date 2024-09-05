import { Component, OnDestroy, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';
import { MyMeDocument } from '../../../mydb/types/me';
import { MaterialModule } from '../../../material.module';
import { REMINDER_INTERVAL } from '../../../../models/reminder';
import { DueSelectComponent } from '../../selects/due-select/due-select.component';
import { ReminderSelectComponent } from '../../selects/reminder-select/reminder-select.component';

@Component({
  selector: 'app-settings-others-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    DueSelectComponent,
    ReminderSelectComponent,
  ],
  templateUrl: './others-form.component.html',
  styleUrls: ['./others-form.component.scss', '../form.scss']
})
export class OthersFormComponent implements OnDestroy {
  user: Signal<MyMeDocument>;

  form: FormGroup;
  formSub: Subscription;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.user = this.authService.me;
    const reminder = this.authService.me().defaultReminder || REMINDER_INTERVAL.DUE;

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
