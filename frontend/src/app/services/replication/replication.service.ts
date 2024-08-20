import { Injectable } from '@angular/core';
import { DataApiService } from '../data-api/data-api.service';
import { Subject, firstValueFrom, lastValueFrom } from 'rxjs';
import { graphQLGenerationInput } from '../../mydb/types/graphql-types';
import { MutationResponse, PullResult, PushResult, QueryResponse, SubscriptionResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MyMeCollection } from '../../mydb/types/me';
import { MyListsCollection } from '../../mydb/types/lists';
import { MyItemCollection } from '../../mydb/types/list-item';
import { MyPushRow } from '../../mydb/types/common';
import { pullQueryBuilderFromSchema, pullStreamBuilderFromSchema, pushQueryBuilderFromSchema } from '../../mydb/graphql-helpers';
import { replicateCollection } from '../../mydb/replication';

type GenerationInputKey = keyof typeof graphQLGenerationInput;

@Injectable({
  providedIn: 'root'
})
export class ReplicationService {

  replications: {[key: string]: any} = {};
  streamSubjects: {[key: string]: Subject<any>} = {};
  lastPusherState = false;

  constructor(
    private api: DataApiService,
    private pusher: PusherService
  ) {
    this.pusher.online.subscribe(isOnline => {
      if (isOnline && isOnline != this.lastPusherState) {
        Object.values(this.streamSubjects).forEach(subj => {
          subj.next('RESYNC');
        });
      }
      this.lastPusherState = isOnline;
    })
  }

  async setupReplication(
    collectionName: string,
    collection: MyMeCollection | MyListsCollection | MyItemCollection,
    meId: string | null
  ) {
    if (!(await firstValueFrom(this.pusher.online))) {
      await new Promise(resolve => {
        const waitInterval = setInterval(async () => {
          const online = await firstValueFrom(this.pusher.online);
          if (online) {
            clearInterval(waitInterval);
            resolve(null);
          }
        }, 10);
      });
    }

    const that = this;
    const schema = graphQLGenerationInput[collectionName as GenerationInputKey];
    const pullQuery = pullQueryBuilderFromSchema(
      collectionName,
      schema
    );

    const pushQuery = pushQueryBuilderFromSchema(
      collectionName,
      schema
    );

    const operationName = collectionName[0].toUpperCase() + collectionName.substring(1);
    const replication = await replicateCollection({
      replicationIdentifier: collectionName,
      collection,
      pull: {
        async handler(checkpoint: unknown, batchSize: number) {
          const query = pullQuery(checkpoint, batchSize);

          query.query = fixArraysInSchema(query.query, schema);

          const result = await firstValueFrom(that.api.graphQL<QueryResponse<PullResult>>(query));

          return (result.data as PullResult)['pull' + operationName];
        },
        stream$: await this.initStream(collectionName, meId),
        modifier: (doc: any) => {
          if ('lists' in doc) {
            doc['lists'] = doc['lists']['id'];
          }
          doc['clientUpdatedAt'] = (new Date()).toISOString();

          return doc;
        }
      },
      push: {
        async handler(changedRows: MyPushRow[]) {
          const query = pushQuery(changedRows);

          query.query = fixArraysInSchema(query.query, schema);
    
          const result = await firstValueFrom(that.api.graphQL<MutationResponse<PushResult>>(query));

          return (result.data as PushResult)['push' + operationName];
        },
        modifier: (doc: any) => {
          if ("sharedWith" in doc) {
            delete doc['sharedWith'];
          }
          if ("items" in doc) {
            delete doc['items'];
          }
          if ("lists" in doc) {
            doc['lists'] = {id: doc['lists']};
          }

          return doc;
        }
      }
    });

    this.replications[collectionName] = replication;

    return replication;
  }

  async initStream(collectionName: string, meId: string | null) {
    const schema = graphQLGenerationInput[collectionName as GenerationInputKey];

    const pullStreamQuery = pullStreamBuilderFromSchema(
      collectionName,
      schema
    );

    let headers = {};
    if (!!meId) {
      headers = {id: meId}
    }
    const query = pullStreamQuery(headers);
    
    // fix array items
    query.query = fixArraysInSchema(query.query, schema);

    const subscriptionResponse = await firstValueFrom(this.api.graphQL<SubscriptionResponse<any>>(query.query, query.variables));
    const channel = subscriptionResponse.extensions.lighthouse_subscriptions.channel;

    const operationName = 'stream' + collectionName[0].toUpperCase() + collectionName.substring(1);

    const pullStream = new Subject<any>();

    this.pusher.subscribe(channel, (data: any) => {
      data = data[operationName];
      pullStream.next({
        documents: data.documents,
        checkpoint: data.checkpoint
      });
    });

    this.streamSubjects[collectionName] = pullStream;

    return pullStream.asObservable();
  }

}

function fixArraysInSchema(query: string, schema: any): string {
  
  // Object.keys(schema.schema.properties).forEach(key => {
  //   const value = Object(schema.schema.properties)[key];
    
  //   if (value.type === 'array') {
  //     if (value.items.type === 'object') {
  //       const props = Object.keys(value.items.properties);
  //       query = query.replace(key, `${key} {${props.join(' ')}}`);
  //     }
  //   }
  // });

  if (query.indexOf('pushItems') > -1 || query.indexOf('streamItems') > -1 || query.indexOf('pullItems') > -1) {
    query = query.replace('lists', 'lists { id }');
  }

  return query.replace('clientUpdatedAt', '');
}