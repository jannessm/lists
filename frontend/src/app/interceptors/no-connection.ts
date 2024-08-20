import { HttpEventType, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { PusherService } from "../services/pusher/pusher.service";
import { catchError, map, of, timeout } from "rxjs";

export function noConnectionInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const pusher = inject(PusherService);
    
    return next(req).pipe(
        map(event => {
            if (event.type === HttpEventType.ResponseHeader && event.status === 0) {
                throw new Error('timeout');
            }
            return event;
        }),
        timeout(10_000),
        catchError(err => {
            pusher.online.next(false);
            return of();
        })
    );
  }