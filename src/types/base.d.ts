type BaseJson = {
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

export type {
    BaseJson,
    AbstractConstructorOptions,
    BaseConstructorOptions,
    BaseInterface,
}