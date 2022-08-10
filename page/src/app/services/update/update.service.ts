import { Injectable } from '@angular/core';
import { fromEvent, map, merge, Observable, Observer, of, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  callbacks: {[name: string]: Function} = {};
  _interval: Subscription | undefined;
  isOnline: Observable<boolean>;

  constructor() {
    this.isOnline = merge(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      })
    )

    this.isOnline.subscribe(online => {
      if (online) {
        this.update();
      }
    });
    
  }

  register(name: string, fn: Function) {
    if (!this.callbacks[name]) {
      this.callbacks[name] = fn;
    }
  }

  update() {
    of().subscribe(() => {
      Object.values(this.callbacks).forEach(fn => fn());
    });
  }
}
