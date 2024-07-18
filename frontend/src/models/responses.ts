import { Checkpoint } from "./rxdb/common";

export interface AuthResponse {
    message?: string;
    errors?: {
        email: [string];
    }
}
export interface ValidateResponse {
    loggedIn: boolean;
}
export interface VerifyMailResponse {
    verified: boolean;
}
export interface ChangeEmailResponse {
    status: ChangeEmailStatus
}

export enum ChangeEmailStatus {
    OK = 'ok',
    EMAIL_ALREADY_USED = 'email already used',
    ERROR = 'error',
}

export interface QueryResponse<T> {
    data: T
}

export interface MutationResponse<T> {
    data: T
}

export interface SubscriptionResponse<T> {
    data: T;
    extensions: {
        lighthouse_subscriptions: {
            channel: string;
        }
    }
}

export interface PullResult {
    [key: string]: {
        documents: any[];
        checkpoint: Checkpoint;
    }
}

export interface PushResult {
    [key: string]: any[];
}

export interface PullTasks {
    pullTasks: {
        documents: any; 
        checkpoint: Checkpoint;
    }
}

export interface PushTasks {
    pushTasks: any;
}