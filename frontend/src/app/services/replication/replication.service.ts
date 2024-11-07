import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { DataApiService } from '../data-api/data-api.service';
import { Subject, firstValueFrom, lastValueFrom } from 'rxjs';
import { DATA_TYPE, graphQLGenerationInput } from '../../mydb/types/graphql-types';
import { MutationResponse, PullResult, PushResult, QueryResponse, SubscriptionResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MyPushRow } from '../../mydb/types/common';
import { pullQueryBuilderFromSchema, pullStreamBuilderFromSchema, pushQueryBuilderFromSchema } from '../../mydb/graphql-helpers';
import { replicateCollection } from '../../mydb/replication';
import { MyCollection } from '../../mydb/collection';
import { MyReplicationOptions } from '../../mydb/types/replication';
import { fixQuery, packRef, removeItems, unpackRef } from './helper';

type GenerationInputKey = keyof typeof graphQLGenerationInput;

@Injectable({
  providedIn: 'root'
})
export class ReplicationService implements OnDestroy {

  @HostListener('document:visibilitychange', ['$event'])
  visibilitychange() {
    if (this.lastPusherState) {
      Object.values(this.streamSubjects).forEach(subj => {
        subj.next('RESYNC');
      });
    }

  }

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
    });
  }

  ngOnDestroy(): void {
    Object.values(this.streamSubjects).forEach(subj => subj.complete());
  }

  async setupReplication(
    collectionName: string,
    collection: MyCollection<any, unknown, unknown>,
    meId: string | null
  ) {
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

    const replicationConfig: MyReplicationOptions = {
      replicationIdentifier: collectionName,
      collection,
      pull: {
        async handler(checkpoint: unknown, batchSize: number) {
          const query = pullQuery(checkpoint, batchSize);

          query.query = fixQuery(query.query);

          const result = await firstValueFrom(that.api.graphQL<QueryResponse<PullResult>>(query));

          return (result.data as PullResult)['pull' + operationName];
        },
        stream$: await this.initStream(collectionName, meId),
        modifier: (doc: any) => {
          packRef(doc, ['createdBy', 'sharedWith']);

          if (collectionName == 'me') {
            doc['lists'] = doc['lists'].map((d: any) => d['id']);
          } else if ('lists' in doc) {
            doc['lists'] = doc['lists']['id'];
          }

          doc['clientUpdatedAt'] = (new Date()).toISOString();

          return doc;
        }
      }
    };

    if (collectionName !== DATA_TYPE.USERS) {
      replicationConfig['push'] = {
        async handler(changedRows: MyPushRow[]) {
          const query = pushQuery(changedRows);

          query.query = fixQuery(query.query);
    
          const result = await firstValueFrom(that.api.graphQL<MutationResponse<PushResult>>(query));

          return (result.data as PushResult)['push' + operationName];
        },
        modifier: (doc: any) => {
          removeItems(doc, ['sharedWith', 'items']);
          
          unpackRef(doc, ['createdBy']);
          
          if (collectionName == 'me') {
            delete doc['lists'];
          } else if ('lists' in doc) {
            doc['lists'] = {id: doc['lists']};
          }

          return doc;
        }
      };
    }

    const replication = await replicateCollection(replicationConfig);

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
    query.query = fixQuery(query.query);

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