type ApiRequestBody = {
    "version": string,
    "game": string,
    "gameVersion": string,
    "platform": string,
    "language": string,
    "data": Record<string, string>
}

type AbstractConstructorOptions = {
    debug?: boolean;
    userId: string;
    password?: string;
}

type BaseConstructorOptions = AbstractConstructorOptions & {
    gameVersion: number;
}

interface BaseInterface {
    debug: boolean;
}

interface FetchOptions { 
    path: string;
    body?: Record<string, string>;
}

interface FetchResponse {
    "serverTime": number,
    "result": string,
    "errorMessage": string
}

export type {
    ApiRequestBody,
    AbstractConstructorOptions,
    BaseConstructorOptions,
    BaseInterface,
    FetchOptions,
    FetchResponse,
}