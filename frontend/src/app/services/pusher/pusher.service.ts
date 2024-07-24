import { Injectable } from '@angular/core';
import Pusher from 'pusher-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PusherService {
  pusher: Pusher | undefined;
  channels: string[] = [];
  socketID: string = '';

  online = new BehaviorSubject<boolean>(false);

  constructor() { }

  init() {
    if (!this.pusher) {
      this.pusher = new Pusher('app-key', {
        cluster: '127.0.0.1',
        wsHost: '127.0.0.1',
        wsPort: 6001,
        forceTLS: false,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/graphql/subscriptions/auth',
      });
  
      const connection = this.pusher.connection;
  
      connection.bind('connected', () => {
        console.log('connected');
        this.online.next(true);
      });
      connection.bind('connecting', () => {
        console.log('connecting');
        this.online.next(false);
      });
      connection.bind('unavailable', () => {
        console.log('unavailable');
        this.online.next(false);
      });
      connection.bind('failed', () => {
        console.log('failed');
        this.online.next(false);
      });
      connection.bind('disconnected', () => {
        console.log('disconnected');
        this.online.next(false);
      });

      this.online.subscribe(isOnline => {
        this.socketID = isOnline ? connection.socket_id : '';
        this.channels
      });
    }
  }

  subscribe(channel: string, callback: Function) {
    if (!this.pusher) {
      this.init();
    }

    if (this.pusher) {
      this.channels.push(channel);
      this.pusher.subscribe(channel).bind('lighthouse-subscription', (payload: any) => {
        if (!payload.more) {
          this.pusher?.unsubscribe(channel);
        }

        const result = payload.result.data;

        if (result) {
          callback(result);
        }
      });
    }
  }

  unsubscribe() {
    this.channels.forEach(channel => {
      this.pusher?.unsubscribe(channel);
    })
  }
}
