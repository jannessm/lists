import { Injectable } from '@angular/core';
import { RxCollection, RxGraphQLReplicationQueryBuilderResponseObject, addRxPlugin, hasProperty } from 'rxdb';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { DataApiService } from '../data-api/data-api.service';
import { Subject, firstValueFrom, lastValueFrom } from 'rxjs';
import { pullQueryBuilderFromRxSchema, pullStreamBuilderFromRxSchema, pushQueryBuilderFromRxSchema } from 'rxdb/plugins/replication-graphql';
import { graphQLGenerationInput } from '../../../models/rxdb/graphql-types';
import { MutationResponse, PullResult, PushResult, QueryResponse, SubscriptionResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { RxMeCollection } from '../../../models/rxdb/me';
import { RxListsCollection } from '../../../models/rxdb/lists';
import { RxItemCollection } from '../../../models/rxdb/list-item';

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
    collection: RxMeCollection | RxListsCollection | RxItemCollection,
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
    const pullQuery = pullQueryBuilderFromRxSchema(
      collectionName,
      schema
    );

    const pushQuery = pushQueryBuilderFromRxSchema(
      collectionName,
      schema
    );

    const operationName = collectionName[0].toUpperCase() + collectionName.substring(1);
    const replication = await replicateRxCollection({
      replicationIdentifier: collectionName,
      collection,
      pull: {
        async handler(checkpoint: unknown, batchSize: number) {
          const query = pullQuery(checkpoint, batchSize) as RxGraphQLReplicationQueryBuilderResponseObject;

          query.query = fixArraysInSchema(query.query, schema);

          const result = await firstValueFrom(that.api.graphQL<QueryResponse<PullResult>>(query));

          return (result.data as PullResult)['pull' + operationName];
        },
        stream$: await this.initStream(collectionName, meId),
        modifier: doc => {
          if ('lists' in doc) {
            doc['lists'] = doc['lists']['id'];
          }
          doc['clientUpdatedAt'] = (new Date()).toISOString();

          return doc;
        }
      },
      push: {
        async handler(changedRows) {
          const query = pushQuery(changedRows) as RxGraphQLReplicationQueryBuilderResponseObject;

          query.query = fixArraysInSchema(query.query, schema);
    
          const result = await firstValueFrom(that.api.graphQL<MutationResponse<PushResult>>(query));

          return (result.data as PushResult)['push' + operationName];
        },
        modifier: doc => {
          if ("sharedWith" in doc) {
            delete doc['sharedWith'];
          }
          if ("items" in doc) {
            delete doc['items'];
          }
          if ("lists" in doc) {
            doc['lists'] = {id: doc['lists']};
          }

          delete doc['clientUpdatedAt'];

          return doc;
        }
      }
    });

    this.replications[collectionName] = replication;

    replication.remoteEvents$.subscribe((ev: any) => console.log('remoteEvent', ev.documents[0]));

    return replication;
  }

  async initStream(collectionName: string, meId: string | null) {
    const schema = graphQLGenerationInput[collectionName as GenerationInputKey];

    const pullStreamQuery = pullStreamBuilderFromRxSchema(
      collectionName,
      schema
    );

    let headers = {};
    if (!!meId) {
      headers = {id: meId}
    }
    const query = pullStreamQuery(headers) as RxGraphQLReplicationQueryBuilderResponseObject;
    
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
  
  Object.keys(schema.schema.properties).forEach(key => {
    const value = Object(schema.schema.properties)[key];
    
    if (value.type === 'array') {
      if (value.items.type === 'object') {
        const props = Object.keys(value.items.properties);
        query = query.replace(key, `${key} {${props.join(' ')}}`);
      }
    }
  });

  if (query.indexOf('pushItems') > -1 || query.indexOf('streamItems') > -1 || query.indexOf('pullItems') > -1) {
    query = query.replace('lists', 'lists { id }');
  }

  return query.replace('clientUpdatedAt', '');
}