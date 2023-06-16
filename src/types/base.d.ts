type JSON = Record<string, string | boolean | string[] | Record<JSON>>

type ApiRequestBody = {
    "version": string,
    "game": string,
    "gameVersion": string,
    "platform": string,
    "language": string,
    "data": JSON;
}

type AbstractConstructorOptions = {
    debug?: boolean;
    userId: string;
    password?: string;
}

type BaseConstructorOptions = AbstractConstructorOptions & {
    game: string;
    baseJson?: JSON;
}

interface BaseInterface {
    debug: boolean;
}

interface FetchOptions { 
    path: string;
    body?: JSON;
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