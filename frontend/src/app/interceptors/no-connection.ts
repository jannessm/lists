import { HttpEventType, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { PusherService } from "../services/pusher/pusher.service";
import { catchError, map, of, tap, throwError, timeout } from "rxjs";

export function noConnectionInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const pusher = inject(PusherService);
    
    return next(req).pipe(
        timeout(30_000),
        tap(event => {
            if (
                (event.type === HttpEventType.ResponseHeader && event.status === 0)
            ) {
                pusher.online.next(false);
            } else if (!pusher.online.value) {
                pusher.online.next(true);
            }
        }),
        catchError(err => {
            // pusher.online.next(false);
            throw err;
        })
    );
  }