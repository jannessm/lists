import { Injectable, Signal, WritableSignal, effect, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { PushSettings } from './push-settings';
import { DataApiService } from '../data-api/data-api.service';

@Injectable({
  providedIn: 'root'
})
export class WebPushService {

  sub: Signal<PushSubscription | null | undefined>;
  subscribeChallenged = false;
  initTimeoutDone = signal(false);

  settings: WritableSignal<PushSettings | null>;

  constructor(
    private swPush: SwPush,
    private authService: AuthService,
    private dataApi: DataApiService
  ) {
    const settingsItem = localStorage.getItem('pushSettings');
    let settings: PushSettings | null;
    if (!!settingsItem) {
      settings = JSON.parse(settingsItem) as PushSettings;
    } else {
      settings = null;
    }
    this.settings = signal(settings);

    if (swPush.isEnabled) {
      this.sub = toSignal(swPush.subscription);
    } else {
      this.sub = signal(undefined);
    }
    
    effect(() => {
      const sub = this.sub();
      if (!this.subscribeChallenged && this.authService.me() && swPush.isEnabled) {
        this.subscribe();
      } else if (!!sub) {
        this.getSettings(sub.endpoint);
      }
    });
  }

  requestSub() {
    if (confirm('Erlaube Push Nachrichten, um immer auf dem Laufenden zu bleiben und an ToDos erinnert zu werden.')) {
      this.subscribe();
    }
  }

  async subscribe(secondTry = false) {
    this.subscribeChallenged = true;
    
    const sub = await this.swPush.requestSubscription({
      serverPublicKey: environment.vapid
    }).catch(async (err) => {
      console.log(err);
      return;
    });

    if (sub) {
      this.authService.pushSubscribe(sub).subscribe(success => {
        if (success) {
          this.getSettings(sub.endpoint);
        }
      });
    } else if (!secondTry) {
      await this.swPush.unsubscribe();
      await this.subscribe(true)
    }
  }

  getSettings(endpoint: string) {
    this.dataApi.graphQL<{data?: {pushSettings?: PushSettings}}>(`
      query PushSettings($endpoint: String!) {
        pushSettings(endpoint: $endpoint) {
          receivePush
          receiveListsChanged
          receiveReminder
        }
      }
    `, {
      endpoint
    }).subscribe(res => {
      if (res.data?.pushSettings) {
        this.settings.set(res.data.pushSettings);
        localStorage.setItem('pushSettings', JSON.stringify(res.data.pushSettings));
      }
    });
  }

  patchSettings(patch: PushSettings, endpoint: string) {
    const settings = this.settings();

    if (this.sub() &&
        (settings?.receivePush !== patch.receivePush ||
         settings?.receiveListsChanged !== patch.receiveListsChanged ||
         settings?.receiveReminder !== patch.receiveReminder)
    ) {
      this.dataApi.graphQL<{data?: {pushSettings?: PushSettings}}>(`
        mutation PushSettings($settings: PushSettingsInput!) {
          pushSettings(settings: $settings) {
            receivePush
            receiveListsChanged
            receiveReminder
          }
        }
      `, {
        settings: {
          ...patch,
          endpoint
        }
      }).subscribe(res => {
        if (res.data?.pushSettings) {
          this.settings.set(res.data.pushSettings);
        }
      });
    }
  }
}
