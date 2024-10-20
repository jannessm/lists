import { HttpEventType, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { PusherService } from "../services/pusher/pusher.service";
import { catchError, tap } from "rxjs";

export function noConnectionInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const pusher = inject(PusherService);
    
    return next(req).pipe(
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
            if (err.type === HttpEventType.ResponseHeader && err.status === 0) {
                pusher.online.next(false);
            }
            throw err;
        })
    );
  }