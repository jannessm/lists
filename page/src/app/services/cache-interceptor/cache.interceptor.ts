import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpEventType
} from '@angular/common/http';
import { from, map, Observable, of } from 'rxjs';
import { UpdateService } from '../update/update.service';
import { db, HttpRequestType } from 'src/app/models/db';
import { API_STATUS } from 'src/app/models/api-responses';
import { AuthService } from '../auth/auth.service';

const UUID_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private updateService: UpdateService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {    
    if (!this.updateService.online && request.urlWithParams.endsWith('?validate')){
      return this.handleOfflineValidate(request);
    
    } else if (!this.updateService.online && request.method !== HttpRequestType.GET) {
      return from(this.handleOfflineNonGet(request));
    
    } else if (!this.updateService.online) {
      return this.handleOfflineGet(request);
    
    } else {
      return this.handleOnline(request, next);
    }
  }

  handleOfflineValidate(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return of(new HttpResponse({
      status: 200,
      body: {
        status: API_STATUS.SUCCESS,
        payload: (<{jwt: string}>request.body).jwt
      }
    }));
  }

  async handleOfflineNonGet(request: HttpRequest<unknown>): Promise<HttpEvent<unknown>> {
    // add-list
    const reqUUID = request.urlWithParams.match('uuid=(' + UUID_REGEX + ')');
    const reqBase = request.urlWithParams.split('?')[0];

    if (request.urlWithParams.indexOf('?add-list&uuid=') > -1 && db.userEmail && reqUUID) {
      this.addListInCache(request, reqBase, reqUUID[1])
    }
    
    // update-list
    // delete-list
    // update-done
    // upate-item-list
    // delete-item
    console.log(request);

    return db.put(
        request.url,
        request.body,
        <HttpRequestType>request.method
      ).then(res => {
        return new HttpResponse({
          status: 201,
          body: {status: API_STATUS.SUCCESS}
        }); // disable changes until offline is working
      });
  }

  handleOfflineGet(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return from(db.get(request.url, <HttpRequestType>request.method)).pipe(map(res => {
      if (res.length == 1) {
        return new HttpResponse({body: res[0].payload, status: 200});
      } else {
        return new HttpResponse({body: {status: 'error', req: request.url, res}, status: 404});
      }
    }));
  }

  handleOnline(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(map(res => {
      if (res.type == HttpEventType.Response && !!res.body && request.method === HttpRequestType.GET) {
        db.put(request.url, res.body, <HttpRequestType>request.method);
      }
      return res;
    }));
  }

  async addListInCache(request: HttpRequest<unknown>, reqBase: string, listUUID: string) {
    if (db.userEmail) {
      const getListReq = reqBase + '?get-lists&email=' + encodeURIComponent(db.userEmail);
      console.log(getListReq);
      const listsReq = await db.get(getListReq, HttpRequestType.GET);
      
      const lists = listsReq[0].payload.payload;
      lists.push((<any>request.body).list);
      console.log(lists, listsReq[0]);
      await db.put(getListReq, listsReq[0].payload, HttpRequestType.GET);
      await db.put(reqBase + '?get-items-for-list&list_id=' + listUUID, [], HttpRequestType.GET);
    }
  }
}
