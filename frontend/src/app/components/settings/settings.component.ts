import { CommonModule } from '@angular/common';
import { Component, OnDestroy, Signal, WritableSignal, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { MyMeDocument } from '../../mydb/types/me';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { PusherService } from '../../services/pusher/pusher.service';
import { Subscription } from 'rxjs';
import { EditFormComponent } from './edit-form/edit-form.component';
import { ThemeFormComponent } from './theme-form/theme-form.component';
import { PushFormComponent } from './push-form/push-form.component';
import { OthersFormComponent } from './others-form/others-form.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MaterialModule,
    NameBadgePipe,
    EditFormComponent,
    ThemeFormComponent,
    PushFormComponent,
    OthersFormComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnDestroy {
  user: Signal<MyMeDocument>;
  userName = signal('');
  version = environment.version;

  editMode: WritableSignal<boolean> = signal(false);
  editFormDisabled: WritableSignal<boolean> = signal(false);

  pusherSub: Subscription;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    public pusher: PusherService,
  ) {
    this.user = this.authService.me as Signal<MyMeDocument>;

    this.pusherSub = this.pusher.online.subscribe(isOnline => {
      this.editFormDisabled.set(!isOnline);
    });
  }

  ngOnDestroy(): void {
    this.pusherSub.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }

  enterEditMode() {
    if (this.user()) {
      this.editMode.set(true);
    } else {
      this.editMode.set(false);
    }
  }

  openGithub() {
    window.open('https://github.com/jannessm/lists', '_blank')?.focus();
  }

}
