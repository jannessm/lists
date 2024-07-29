import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BASE_API } from '../../globals';
import { MutationResponse, SubscriptionResponse } from '../../../models/responses';
import { RxGraphQLReplicationQueryBuilderResponseObject } from 'rxdb';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class DataApiService {

  constructor(private http: HttpClient, private cookies: CookieService) { }

  headers() {
    const xsrf = this.cookies.get('XSRF-TOKEN');

    if (!xsrf) {
      return {}
    }

    return {
      'X-XSRF-TOKEN': xsrf
    }
  }

  mutation<T>(
    query: string | RxGraphQLReplicationQueryBuilderResponseObject,
    variables: any = {}
  ): Observable<MutationResponse<T>> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query
    }

    return this.http.post(BASE_API + 'graphql', {
      query: "mutation " + query,
      variables
    }).pipe(map(res => res as MutationResponse<T>));
  }

  subscription<T>(
    query: string | RxGraphQLReplicationQueryBuilderResponseObject,
    variables: any = {}
  ): Observable<SubscriptionResponse<T>> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query
    }

    return this.http.post(BASE_API + 'graphql', {
      query: "subscription " + query,
      variables
    }).pipe(map(res => res as SubscriptionResponse<T>))
  }

  graphQL<T>(
    query: string | RxGraphQLReplicationQueryBuilderResponseObject,
    variables: any = {}
  ): Observable<T> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query;
    }

    return this.http.post(BASE_API + 'graphql', {
      query,
      variables
    }).pipe(map(res => res as T))
  }
}
