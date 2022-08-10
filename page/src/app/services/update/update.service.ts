import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, fromEvent, map, merge, Observable, Observer, of, Subscription } from 'rxjs';
import { db, HttpRequestType } from 'src/app/models/db';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  callbacks: {[name: string]: Function} = {};
  _interval: Subscription | undefined;
  isOnline: Observable<boolean>;
  online: boolean = true;

  constructor(private http: HttpClient) {
    this.isOnline = merge(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      })
    )

    this.isOnline.subscribe(online => {
      this.online = online;
      if (online) {
        this.update().subscribe();
      }
    });
    
  }

  register(name: string, fn: Function) {
    if (!this.callbacks[name]) {
      this.callbacks[name] = fn;
    }
  }

  update() {
    return from(db.cachedQueries.toArray()).pipe(map(reqs => {

      reqs.forEach(req => {
        switch (req.requestType) {
          case HttpRequestType.POST:
            this.http.post(req.uri, req.payload).subscribe(() => this.delReq(req.uri));
            break;
          case HttpRequestType.DELETE:
            this.http.delete(req.uri).subscribe(() => this.delReq(req.uri));
        }
      })
    })).pipe(map(() => {
      Object.values(this.callbacks).forEach(fn => fn()); // update all data after pushed offline changes
    }));
  }

  delReq(uri: string) {
    db.cachedQueries.delete(uri)
  }
}
