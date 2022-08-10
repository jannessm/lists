import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpEventType
} from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { UpdateService } from '../update/update.service';
import { db, HttpRequestType } from 'src/app/models/db';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  isOnline: boolean = true;

  constructor(private updateService: UpdateService) {
    this.updateService.isOnline.subscribe(online => {
      this.isOnline = online;
    });
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {    
    if (!this.isOnline) {
      return from(db.get(request.url)).pipe(map(res => {
        return new HttpResponse({body: res[0].payload, status: 200});
      }));
    
    } else {
      return next.handle(request).pipe(map(res => {
        if (res.type == HttpEventType.Response && !!res.body) {
          db.put(request.url, res.body, <HttpRequestType>request.method);
        }
        return res;
      }));
    }
  }
}
