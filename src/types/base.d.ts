type ApiRequestBody = {
    "version": string,
    "game": string,
    "gameVersion": string,
    "platform": string,
    "language": string,
    "data": Record<string, string | boolean>
}

type AbstractConstructorOptions = {
    debug?: boolean;
    userId: string;
    password?: string;
}

type BaseConstructorOptions = AbstractConstructorOptions & {
    game: string;
    baseJson?: Record<string, string | boolean>;
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
    "errorMessage"?: string
}

export type {
    ApiRequestBody,
    AbstractConstructorOptions,
    BaseConstructorOptions,
    BaseInterface,
    FetchOptions,
    FetchResponse,
}