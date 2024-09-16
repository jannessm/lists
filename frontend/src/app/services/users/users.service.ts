import { Injectable } from '@angular/core';
import { DataService } from '../data/data.service';
import { MyUsersDocument } from '../../mydb/types/users';
import { Observable, combineLatest, combineLatestAll, filter, map, merge, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private data: DataService) { }

  get(id: string): Observable<MyUsersDocument> {
    const query = this.data.db.users.find().$ as Observable<any[]>;
    const meQuery = this.data.db.me.findOne().$ as Observable<any>;

    const users = combineLatest([query, meQuery]);
    return users.pipe(
      map(([q, me]) => {
        
        if (me  && me.id === id) {
          return me;
        } else if (!!q) {
          return q.find(doc => id === doc.id);
        }
        return undefined;
      }),
      filter(doc => !!doc),
    ) as  Observable<MyUsersDocument>;
  }

  getMany(ids: string[]): Observable<MyUsersDocument[]> {
    const query = this.data.db.users.find().$ as Observable<any[]>;
    const meQuery = this.data.db.me.findOne().$ as Observable<any>;

    const users = combineLatest([query, meQuery]);
    return users.pipe(
      map(([q, me]) => {
        if (!!q && !!me) {
          return [...q, me].filter(doc => 
            !!doc && !!ids.find(i => i === doc.id)).sort(byIds(ids));
        } else if (!!q) {
          return q.filter(doc => !!ids.find(i => i === doc.id)).sort(byIds(ids));
        } else if (!!me) {
          return [me].filter(doc => !!ids.find(i => i === doc.id)).sort(byIds(ids));
        } else {
          return [];
        }
      }),
      filter(doc => doc.length > 0),
    ) as  Observable<MyUsersDocument[]>;
  }
}

function byIds(ids: string[]) {
  return (a: MyUsersDocument, b: MyUsersDocument) => {
    return ids.findIndex(i => a.id === i) - ids.findIndex(i => b.id === i);
  }
}