import { Injectable } from '@angular/core';
import { RxCollection, RxGraphQLReplicationQueryBuilderResponseObject } from 'rxdb';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { DataApiService } from '../data-api/data-api.service';
import { Subject, firstValueFrom } from 'rxjs';
import { pullQueryBuilderFromRxSchema, pullStreamBuilderFromRxSchema, pushQueryBuilderFromRxSchema } from 'rxdb/plugins/replication-graphql';
import { graphQLGenerationInput } from '../../../models/data';
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
    const pullQuery = pullQueryBuilderFromRxSchema(
      collectionName,
      graphQLGenerationInput[collectionName as GenerationInputKey]
    );

    const pushQuery = pushQueryBuilderFromRxSchema(
      collectionName,
      graphQLGenerationInput[collectionName as GenerationInputKey]
    );


    const replication = await replicateRxCollection({
      replicationIdentifier: collectionName,
      collection,
      pull: {
        async handler(checkpoint: unknown, batchSize: number) {
          const query = pullQuery(checkpoint, batchSize) as RxGraphQLReplicationQueryBuilderResponseObject;
          const result = await firstValueFrom(that.api.graphQL<QueryResponse<PullResult>>(query));
          return (result.data as PullResult)['pull' + collectionName[0].toUpperCase() + collectionName.substring(1)];
        },
        stream$: await this.initStream(collectionName)
      },
      push: {
        async handler(changedRows) {
          const query = pushQuery(changedRows) as RxGraphQLReplicationQueryBuilderResponseObject;
          const result = await firstValueFrom(that.api.graphQL<MutationResponse<PushResult>>(query));
          console.log(result);
          return (result.data as PushResult)['push' + collectionName[0].toUpperCase() + collectionName.substring(1)];
        }
      }
    });

    this.replications[collectionName] = replication;

    return replication;
  }

  async initStream(collectionName: string) {
    const pullStreamQuery = pullStreamBuilderFromRxSchema(
      collectionName,
      graphQLGenerationInput[collectionName as GenerationInputKey]
    );

    const query = pullStreamQuery({}) as RxGraphQLReplicationQueryBuilderResponseObject;
    const subscriptionResponse = await firstValueFrom(this.api.graphQL<SubscriptionResponse<any>>(query.query));
    const channel = subscriptionResponse.extensions.lighthouse_subscriptions.channel;

    const operationName = 'stream' + collectionName[0].toUpperCase() + collectionName.substring(1);

    const pullStream = new Subject<any>();

    this.pusher.subscribe(channel, (data: any) => {
      data = data[operationName];
      pullStream.next(data);
    });

    this.streamSubjects[collectionName] = pullStream;

    return pullStream.asObservable();
  }
}
