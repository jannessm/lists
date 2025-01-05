import { HttpEventType, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth/auth.service";
import { PusherService } from "../services/pusher/pusher.service";
import { catchError, tap } from "rxjs";

export function noConnectionInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const pusher = inject(PusherService);
    const auth = inject(AuthService);

    return next(req).pipe(
        tap(event => {
            if (
                (event.type === HttpEventType.ResponseHeader && event.status === 0)
            ) {
                pusher.online.next(false);
            } else if (!pusher.online.value) {
                pusher.online.next(true);
            }

            const resp = event as any;
            if (resp.type === HttpEventType.Response && resp.body.hasOwnProperty("errors") &&
                Array.isArray(resp.body.errors) && resp.body.errors[0].hasOwnProperty("message") &&
                resp.body.errors[0].message === "Unauthenticated.") {
                auth.setLoggedOut();
            }
        }),
        catchError(err => {
            if (err.type === HttpEventType.ResponseHeader && err.status === 0) {
                pusher.online.next(false);
            } else if (err.name === "HttpErrorResponse" && err.status === 419) {
                console.log('invalid csrf');
                auth.refreshCSRF().subscribe(() => {});
            }
            throw err;
        })
    );
  }
