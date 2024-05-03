import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SwUpdate } from '@angular/service-worker';
import { repeat, from, fromEvent, of, map, merge, Observable, Observer, Subscription, timeout } from 'rxjs';
import { ConfirmSheetComponent } from 'src/app/components/bottom-sheets/confirm-sheet/confirm-sheet.component';
import { db, HttpRequestType } from 'src/app/models/db';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  callbacks: {[name: string]: Function} = {};
  _interval: Subscription | undefined;
  isOnline: Observable<boolean>;
  online: boolean = true;
  last_online: boolean | undefined;
  http: HttpClient;
  
  pingInterval: number = 30 * 1000;
  timeout: number = 1000;

  constructor(private httpBackend: HttpBackend,
              private readonly updates: SwUpdate,
              private bottomSheet: MatBottomSheet,
              private lsService: LocalStorageService) {
    this.http = new HttpClient(httpBackend);

    if (environment.production || true) {
      // this.isOnline = merge(
      //     fromEvent(window, 'offline')
      //       .pipe(map(() => false)),
      //     this.http.get(environment.api + '?ping').pipe(
      //         timeout({
      //           each: this.timeout,
      //           with: () => from([false])
      //         }),
      //         repeat({ delay: this.pingInterval }),
      //         map(res => res !== false)),
      //     new Observable((sub: Observer<boolean>) => {
      //       sub.next(navigator.onLine);
      //       sub.complete();
      //     })
      //   );
      this.isOnline = merge(
        fromEvent(window, 'offline').pipe(map(() => false)),
        fromEvent(window, 'online').pipe(map(() => true)),
        new Observable((sub: Observer<boolean>) => {
          sub.next(navigator.onLine);
          sub.complete();
        })
      ); 
    } else {
      this.isOnline = of(true);
    }

    this.isOnline.subscribe(online => {
      this.online = online;
      if (online && online !== this.last_online) {
        this.updateData().subscribe();
      }
      if (online !== this.last_online) {
        console.log("online:", online);
      }
      this.last_online = online;
    });

    this.updates.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_DETECTED') {
        this.showAppUpdateAlert();
      }
    });
    
  }

  register(name: string, fn: Function) {
    if (!this.callbacks[name]) {
      this.callbacks[name] = fn;
    }
  }

  updateData() {
    return from(db.cachedQueries.toArray()).pipe(map(reqs => {

      reqs.sort((a,b) => a.requested - b.requested);

      const options = {withCredentials: true, headers: {}};
      if (this.lsService.jwt != null || this.lsService.jwt !== undefined) {
        options['headers'] = {
            Authorization : `Bearer "${this.lsService.jwt}"`
          };
      }
  
      reqs.forEach(req => {
        switch (req.requestType) {
          case HttpRequestType.POST:
            this.http.post(req.uri, req.payload, options).subscribe(() => this.delReq(req.uri));
            break;
          case HttpRequestType.DELETE:
            this.http.delete(req.uri, options).subscribe(() => this.delReq(req.uri));
        }
      })
    })).pipe(map(() => {
      Object.values(this.callbacks).forEach(fn => fn()); // update all data after pushed offline changes
    }));
  }

  delReq(uri: string) {
    db.cachedQueries.delete(uri)
  }

  showAppUpdateAlert() {
    const sheetRef = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Ein Update ist verfügbar! Jetzt updaten?'});

    sheetRef.afterDismissed().subscribe(update => {
      if (update) {
        this.doAppUpdate();
      }
    });
  }
  
  doAppUpdate() {
    this.updates.activateUpdate().then(() => document.location.reload());
  }
}
