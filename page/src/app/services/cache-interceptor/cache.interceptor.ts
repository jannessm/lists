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
import { List, ListItem } from 'src/app/models/lists';

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
    const reqBase = request.urlWithParams.split('?')[0];
    
    // add-list
    if (request.urlWithParams.indexOf('?add-list&uuid=') > -1 && db.userEmail) {
      this.addListInCache(request, reqBase);
    }

    // update-list
    if (request.urlWithParams.indexOf('?update-list&uuid=') > -1 && db.userEmail) {
      this.updateListInCache(request, reqBase)
    }

    // delete-list
    if (request.urlWithParams.indexOf('?delete-list&uuid=') > -1 && db.userEmail) {
      this.deleteListInCache(reqBase, request.params.get('uuid'));
    }

    // add-item
    if (request.urlWithParams.indexOf('?add-item') > -1) {
      this.addItemInCache(request, reqBase);
    }
    // update-done
    if (request.urlWithParams.indexOf('?add-item') > -1) {
      this.updateDoneInCache(request, reqBase,  request.params.get('list_id'));
    }

    // update-item-list
    if (request.urlWithParams.indexOf('?update-item') > -1) {
      this.updateItemInCache(request, reqBase);
    }

    // delete-item
    if (request.urlWithParams.indexOf('?delete-item') > -1) {
      this.deleteItemsInCache(request, reqBase,  request.params.get('list_id'));
    }
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

  async addListInCache(request: HttpRequest<unknown>, reqBase: string) {
    if (db.userEmail) {
      const getListReq = reqBase + '?get-lists&email=' + encodeURIComponent(db.userEmail);
      const listsReq = await db.get(getListReq, HttpRequestType.GET);
      const newList: List = (<any>request.body).list;
      const lists = listsReq[0].payload.payload;
      
      lists.push(newList);

      await db.put(getListReq, listsReq[0].payload, HttpRequestType.GET);
      await db.put(reqBase + '?get-items-for-list&list_id=' + newList.uuid, [], HttpRequestType.GET);
    }
  }

  async updateListInCache(request: HttpRequest<unknown>, reqBase: string) {
    if (db.userEmail) {
      const getListReq = reqBase + '?get-lists&email=' + encodeURIComponent(db.userEmail);
      const listsReq = await db.get(getListReq, HttpRequestType.GET);
      const list: List = (<any>request.body).list;
      
      const lists: Array<List> = listsReq[0].payload.payload;
      const listId = lists.findIndex(l => l.uuid == list.uuid);

      if (listId > -1) {
        lists[listId] = list;
      }
 
      await db.put(getListReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }

  async deleteListInCache(reqBase: string, listUUID: string | null) {
    if (db.userEmail && listUUID != null) {
      const getListReq = reqBase + '?get-lists&email=' + encodeURIComponent(db.userEmail);
      const listsReq = await db.get(getListReq, HttpRequestType.GET);
      const lists: Array<List> = listsReq[0].payload.payload;
      
      const listId = lists.findIndex(l => l.uuid == listUUID);

      if (listId > -1) {
        lists.splice(listId, 1);
      }

      await db.put(getListReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }

  async addItemInCache(request: HttpRequest<unknown>, reqBase: string) {
    if (db.userEmail) {
      const newItem = <ListItem>request.body;
      const getListItemsReq = reqBase + '?get-items-for-list&list_id=' + newItem.list_id;
      const listsReq = await db.get(getListItemsReq, HttpRequestType.GET);
      const items = listsReq[0].payload.payload;
      
      items.push(newItem);
      await db.put(getListItemsReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }

  async updateDoneInCache(request: HttpRequest<unknown>, reqBase: string, list_id: string | null) {
    if (db.userEmail && list_id != null) {
      const itemUUIDs = <string[]>(<any>request.body).uuids;
      const done = <boolean>(<any>request.body).done;
      
      const getListItemsReq = reqBase + '?get-items-for-list&list_id=' + list_id;
      const listsReq = await db.get(getListItemsReq, HttpRequestType.GET);
      const items = <ListItem[]>listsReq[0].payload.payload;
      
      itemUUIDs.forEach(uuid => {
        const item = items.find(i => i.uuid == uuid);
        if (item) {
          item.done = done;
        }
      });
      
      await db.put(getListItemsReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }

  async updateItemInCache(request: HttpRequest<unknown>, reqBase: string) {
    if (db.userEmail) {
      const updatedItem = <ListItem>request.body;

      const getListItemsReq = reqBase + '?get-items-for-list&list_id=' + updatedItem.list_id;
      const listsReq = await db.get(getListItemsReq, HttpRequestType.GET);
      const items = <ListItem[]>listsReq[0].payload.payload;
      
      const itemId = items.findIndex(i => i.uuid == updatedItem.uuid);
      if (itemId > -1) {
        items[itemId] = updatedItem;
      }
      
      await db.put(getListItemsReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }

  async deleteItemsInCache(request: HttpRequest<unknown>, reqBase: string, list_id: string | null) {
    if (db.userEmail && list_id != null) {
      const getListItemsReq = reqBase + '?get-items-for-list&list_id=' + list_id;
      const listsReq = await db.get(getListItemsReq, HttpRequestType.GET);
      const items = <ListItem[]>listsReq[0].payload.payload;
      
      const uuids = request.params.get('uuids');

      if (uuids) {
        uuids.split(',').forEach(uuid => {
          const itemId = items.findIndex(i => i.uuid == uuid);
          if (itemId > -1) {
            items.splice(itemId, 1);
          }
        })
      }

      await db.put(getListItemsReq, listsReq[0].payload, HttpRequestType.GET);
    }
  }
}
