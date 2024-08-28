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

  settings: WritableSignal<PushSettings | undefined> = signal(undefined);

  constructor(
    private swPush: SwPush,
    private authService: AuthService,
    private dataApi: DataApiService
  ) {
    if (swPush.isEnabled) {
      this.sub = toSignal(swPush.subscription);
    } else {
      this.sub = signal(undefined);
    }
    
    effect(() => {
      const sub = this.sub();
      if (sub === null && this.authService.me() && swPush.isEnabled) {
        this.subscribe();
      } else if (!!sub) {
        this.getSettings(sub.endpoint);
      }
    });
  }

  async subscribe() {
    this.subscribeChallenged = true;
    
    const sub = await this.swPush.requestSubscription({
      serverPublicKey: environment.vapid
    }).catch(err => {console.log(err); return;});

    if (sub) {
      this.authService.pushSubscribe(sub).subscribe(success => {
        if (success) {
          this.getSettings(sub.endpoint);
        }
      });
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
