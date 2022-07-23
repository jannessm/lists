import { HttpInterceptor, HttpSentEvent, HttpHeaderResponse, HttpHandler, HttpEvent, HttpRequest, HttpHeaders, HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { LocalStorageService } from "../local-storage/local-storage.service";


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(private http: HttpClient, private lsService: LocalStorageService){
    
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let jsonReq: HttpRequest<any> = req.clone();

    if (this.lsService.jwt != null || this.lsService.jwt !== undefined) {
      jsonReq = req.clone({
        setHeaders:{
          Authorization : `Bearer "${this.lsService.jwt}"`
        }
      });
    }

    return next.handle(jsonReq);
  }
  
}