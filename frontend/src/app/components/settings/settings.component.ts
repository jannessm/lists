
import { Component, OnDestroy, Signal, WritableSignal, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';
import { MyMeDocument } from '../../mydb/types/me';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { PusherService } from '../../services/pusher/pusher.service';
import { DataService } from '../../services/data/data.service';
import { Subscription } from 'rxjs';
import { EditFormComponent } from './edit-form/edit-form.component';
import { ThemeFormComponent } from './theme-form/theme-form.component';
import { PushFormComponent } from './push-form/push-form.component';
import { OthersFormComponent } from './others-form/others-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';
import { ReplicationService } from '../../services/replication/replication.service';

@Component({
    selector: 'app-settings',
    imports: [
    ReactiveFormsModule,
    FormsModule,
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
  syncErrorSub: Subscription;
  isSyncing = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    public pusher: PusherService,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private replicationService: ReplicationService,
  ) {
    this.user = this.authService.me as Signal<MyMeDocument>;

    this.pusherSub = this.pusher.online.subscribe(isOnline => {
      this.editFormDisabled.set(!isOnline);
    });

    this.syncErrorSub = this.replicationService.syncErrorSubject.subscribe(errorInfo => {
      this.handleSyncError(errorInfo.error, errorInfo.context);
    });
  }

  ngOnDestroy(): void {
    this.pusherSub.unsubscribe();
    this.syncErrorSub.unsubscribe();
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

  async sync() {
    if (this.isSyncing) {
      return;
    }
    
    this.isSyncing = true;
    
    try {
      this.dataService.resync();
      
      // Wait a bit to allow sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.snackBar.open('Synchronisierung erfolgreich', 'OK', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      this.isSyncing = false;
    } catch (error) {
      this.isSyncing = false;
      this.handleSyncError(error as Error, 'manual sync');
    }
  }

  private async handleSyncError(error: Error, context: string) {
    console.error('Sync error:', error, 'Context:', context);
    
    this.snackBar.open('Synchronisierung fehlgeschlagen', 'OK', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });

    // Report error to backend
    try {
      await this.http.post(BASE_API + 'report-sync-error', {
        errorMessage: error.message || 'Unknown error',
        errorDetails: {
          context: context,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }, {
        withCredentials: true
      }).toPromise();
    } catch (reportError) {
      console.error('Failed to report sync error:', reportError);
    }
  }

}
