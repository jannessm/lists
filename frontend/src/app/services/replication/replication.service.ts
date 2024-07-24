import { Injectable } from '@angular/core';
import { RxCollection, RxGraphQLReplicationQueryBuilderResponseObject, addRxPlugin, hasProperty } from 'rxdb';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { DataApiService } from '../data-api/data-api.service';
import { Subject, firstValueFrom } from 'rxjs';
import { pullQueryBuilderFromRxSchema, pullStreamBuilderFromRxSchema, pushQueryBuilderFromRxSchema } from 'rxdb/plugins/replication-graphql';
import { graphQLGenerationInput } from '../../../models/rxdb/graphql-types';
import { MutationResponse, PullResult, PushResult, QueryResponse, SubscriptionResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';

type GenerationInputKey = keyof typeof graphQLGenerationInput;

@Injectable({
  providedIn: 'root'
})
export class ReplicationService {

  replications: {[key: string]: any} = {};
  streamSubjects: {[key: string]: Subject<any>} = {};
  lastPusherState = false;

  constructor(private api: DataApiService, private pusher: PusherService) {
    this.pusher.online.subscribe(isOnline => {
      if (isOnline && isOnline != this.lastPusherState) {
        Object.values(this.streamSubjects).forEach(subj => {
          subj.next('RESYNC');
        });
      }
      this.lastPusherState = isOnline;
    })
  }

  async setupReplication(collectionName: string, collection: RxCollection) {
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


    const replication = await replicateRxCollection({
      replicationIdentifier: collectionName,
      collection,
      pull: {
        async handler(checkpoint: unknown, batchSize: number) {
          const query = pullQuery(checkpoint, batchSize) as RxGraphQLReplicationQueryBuilderResponseObject;

          query.query = fixArraysInSchema(query.query, schema);

          const result = await firstValueFrom(that.api.graphQL<QueryResponse<PullResult>>(query));

          return (result.data as PullResult)['pull' + collectionName[0].toUpperCase() + collectionName.substring(1)];
        },
        stream$: await this.initStream(collectionName),
        modifier: doc => {
          if ('description' in doc && doc['description'] === null) {
            doc['description'] = '';
          }
          if ('due' in doc && doc['due'] === null) {
            doc['due'] = '';
          }
          if ('reminder' in doc && doc['reminder'] === null) {
            doc['reminder'] = '';
          }
          if ('emailVerifiedAt' in doc) {
            console.log(doc['emailVerifiedAt']);
            doc['emailVerifiedAt'] = !!doc['emailVerifiedAt'];
          }
          return doc;
        }
      },
      push: {
        async handler(changedRows) {
          const query = pushQuery(changedRows) as RxGraphQLReplicationQueryBuilderResponseObject;

          query.query = fixArraysInSchema(query.query, schema);
    
          const result = await firstValueFrom(that.api.graphQL<MutationResponse<PushResult>>(query));

          return (result.data as PushResult)['push' + collectionName[0].toUpperCase() + collectionName.substring(1)];
        },
        modifier: doc => {
          if ("sharedWith" in doc) {
            delete doc['sharedWith'];
          }
          if ("items" in doc) {
            delete doc['items'];
          }
          return doc;
        }
      }
    });

    this.replications[collectionName] = replication;

    return replication;
  }

  async initStream(collectionName: string) {
    const schema = graphQLGenerationInput[collectionName as GenerationInputKey];

    const pullStreamQuery = pullStreamBuilderFromRxSchema(
      collectionName,
      schema
    );

    const query = pullStreamQuery({}) as RxGraphQLReplicationQueryBuilderResponseObject;
    
    // fix array items
    query.query = fixArraysInSchema(query.query, schema);

    const subscriptionResponse = await firstValueFrom(this.api.graphQL<SubscriptionResponse<any>>(query.query));
    const channel = subscriptionResponse.extensions.lighthouse_subscriptions.channel;

    const operationName = 'stream' + collectionName[0].toUpperCase() + collectionName.substring(1);

    const pullStream = new Subject<any>();

    this.pusher.subscribe(channel, (data: any) => {
      data = data[operationName];
      console.log('recv',   data);
      pullStream.next(data);
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

  return query;
}

function parseDates(row: any) {
  return row;
}