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

  constructor(private updateService: UpdateService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {    
    console.log(request.url, 'intercepted', this.updateService.online);
    if (!this.updateService.online && request.method !== HttpRequestType.GET) {
      return from(db.put(request.url, request.body, <HttpRequestType>request.method)).pipe(map(res => {
        return new HttpResponse({status: 200, body: {status: 'success'}});
      }));
    
    } else if (!this.updateService.online) {
      return from(db.get(request.url, <HttpRequestType>request.method)).pipe(map(res => {
        if (res.length == 1) {
          return new HttpResponse({body: res[0].payload, status: 200});
        } else {
          return new HttpResponse({status: 404});
        }
      }));
    
    } else {
      return next.handle(request).pipe(map(res => {
        if (res.type == HttpEventType.Response && !!res.body && request.method === HttpRequestType.GET) {
          db.put(request.url, res.body, <HttpRequestType>request.method);
        }
        return res;
      }));
    }
  }
}
