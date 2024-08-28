import { Component, OnDestroy, effect } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WebPushService } from '../../../services/web-push/web-push.service';
import { Subscription, debounceTime, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-push-form',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './push-form.component.html',
  styleUrls: ['./push-form.component.scss', '../form.scss']
})
export class PushFormComponent implements OnDestroy {
  form: FormGroup<{
    receivePush: FormControl<boolean | null>,
    receiveListsChanged: FormControl<boolean | null>,
    receiveReminder: FormControl<boolean | null>
  }>;
  formSub: Subscription;
  pushSub: Subscription;

  constructor(private fb: FormBuilder,
              private pushService: WebPushService,
              private snackBar: MatSnackBar) {
    this.form = fb.group({
      receivePush: [false],
      receiveListsChanged: [{value: true, disabled: true}],
      receiveReminder: [{value: true, disabled: true}]
    });

    this.formSub = this.form.valueChanges.pipe(
        debounceTime(1000),
      )
      .subscribe(() => {
        this.saveChanges();
      });

    this.pushSub = this.receivePush.valueChanges.subscribe(() => {      
      this.updateDisableStates();
    });
    

    effect(() => {
      const settings = this.pushService.settings();
      if (settings) {
        this.receivePush.setValue(settings.receivePush && !!this.pushService.sub());
        this.receiveListsChanged.setValue(settings.receiveListsChanged);
        this.receiveReminder.setValue(settings.receiveReminder);
      }
    })
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.pushSub.unsubscribe();
  }

  get receivePush(): FormControl<boolean> {
    return this.form.get('receivePush') as FormControl<boolean>;
  }

  get receiveListsChanged(): FormControl<boolean> {
    return this.form.get('receiveListsChanged') as FormControl<boolean>;
  }

  get receiveReminder(): FormControl<boolean> {
    return this.form.get('receiveReminder') as FormControl<boolean>;
  }

  updateDisableStates() {
    if (!this.receivePush.value) {
      this.receiveListsChanged.disable({emitEvent: false});
      this.receiveReminder.disable({emitEvent: false});
    } else {
      this.receiveListsChanged.enable({emitEvent: false});
      this.receiveReminder.enable({emitEvent: false});
    }
  }

  async saveChanges() {
    let sub = this.pushService.sub();
    if (!sub && !this.pushService.subscribeChallenged) {
      await this.pushService.subscribe();
      sub = this.pushService.sub();
    }

    if (!sub) {
      this.snackBar.open('Bitte Push Benachrichtigungen im Browser aktivieren.', 'Ok');
      
      const settings = this.pushService.settings();
      this.receivePush.setValue(false, {emitEvent: false});
      this.receiveListsChanged.setValue(
        !!settings?.receiveListsChanged ||
        this.receiveListsChanged.value, {emitEvent: false});
      this.receiveReminder.setValue(
        !!settings?.receiveReminder ||
        this.receiveReminder.value, {emitEvent: false});
      
      this.updateDisableStates();
    } else {
      this.pushService.patchSettings({
        receivePush: this.receivePush.value,
        receiveListsChanged: this.receiveListsChanged.value,
        receiveReminder: this.receiveReminder.value,
      }, sub.endpoint);
    }
  }
}
