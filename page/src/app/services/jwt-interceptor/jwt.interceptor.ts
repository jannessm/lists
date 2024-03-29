import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { LocalStorageService } from "../local-storage/local-storage.service";


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(private lsService: LocalStorageService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let jsonReq: HttpRequest<any> = req.clone();

    if (this.lsService.jwt != null || this.lsService.jwt !== undefined) {
      jsonReq = req.clone({
        setHeaders: {
          Authorization : `Bearer "${this.lsService.jwt}"`
        },
        withCredentials: true
      });
    } else {
      jsonReq = req.clone({
        withCredentials: true
      });
    }


    return next.handle(jsonReq);
  }
  
}