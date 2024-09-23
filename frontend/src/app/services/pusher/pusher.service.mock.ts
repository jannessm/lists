import Pusher from 'pusher-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export class MockPusher {
  connection = {
    socket_id: '1234',
  };
}

export class MockPusherService {
  pusher: Pusher = new MockPusher() as Pusher;
  channels: string[] = [];
  socketID: string = '';
  subscrQueue: any[] = [];

  online = new BehaviorSubject<boolean>(false);

  constructor() {
    this.online.subscribe(isOnline => {
      this.socketID = isOnline ? this.pusher.connection.socket_id : '';
        if (!!this.socketID) {
          this.subscrQueue.forEach(args => {
            // this._subscribe(args[0], args[1]);
          });
          this.subscrQueue = [];
        }
    })
  }

  async subscribe(channel: string, callback: Function) {
    if (!this.socketID) {
      this.subscrQueue.push([channel, callback]);
    } else {
      // this._subscribe(channel, callback);
    }

  }
}
