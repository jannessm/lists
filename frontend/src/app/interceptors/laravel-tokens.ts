import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { PusherService } from "../services/pusher/pusher.service";

export function laravelInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const pusher = inject(PusherService);
    let headers = req.headers;

    if (pusher.socketID) {
        headers = headers.append('X-Socket-ID', pusher.socketID);
    }
    
    const newReq = req.clone({headers: headers});
    return next(newReq);
  }