import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BASE_API } from '../../globals';
import { MutationResponse, SubscriptionResponse } from '../../../models/responses';
import { CookieService } from 'ngx-cookie-service';
import { MyGraphQLQuery } from '../../mydb/types/graphql-types';

@Injectable({
  providedIn: 'root'
})
export class DataApiService {

  constructor(private http: HttpClient) { }

  mutation<T>(
    query: string | MyGraphQLQuery,
    variables: any = {}
  ): Observable<MutationResponse<T>> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query
    }

    return this.http.post(BASE_API + 'graphql', {
      query: "mutation " + query,
      variables
    }, {
      headers: {'ngsw-bypass': 'true'}
    }).pipe(map(res => res as MutationResponse<T>));
  }

  subscription<T>(
    query: string | MyGraphQLQuery,
    variables: any = {}
  ): Observable<SubscriptionResponse<T>> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query
    }

    return this.http.post(BASE_API + 'graphql', {
      query: "subscription " + query,
      variables
    },{
      headers: {'ngsw-bypass': 'true'}
    }).pipe(map(res => res as SubscriptionResponse<T>))
  }

  graphQL<T>(
    query: string | MyGraphQLQuery,
    variables: any = {}
  ): Observable<T> {
    if (typeof(query) != 'string') {
      variables = query.variables;
      query = query.query;
    }

    return this.http.post(BASE_API + 'graphql', {
      query,
      variables
    },{
      headers: {'ngsw-bypass': 'true'}
    }).pipe(map(res => res as T))
  }
}
