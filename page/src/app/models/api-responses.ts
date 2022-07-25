export interface ApiResponse {
    status: API_STATUS;
    httpCode: number;
}

export interface DataResponse extends ApiResponse {
    payload: any;
}

export interface ErrorResponse extends ApiResponse {
    message: string;
}

export enum API_STATUS {
    SUCCESS = "success",
    ERROR = "error"
}

export interface ApiCall {
    class: string;
    method: string;
    endpoint: string;
    payload: any;
}