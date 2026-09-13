type JsonValue = string | number | boolean | string[] | null | JSON;

interface JSON {
  [key: string]: JsonValue;
}

interface ApiRequestBody {
  version: string;
  game: string;
  gameVersion: string;
  platform: string;
  language: string;
  data: JSON;
}

interface AbstractConstructorOptions {
  debug?: boolean;
  userId: string;
  password?: string;
}

interface BaseConstructorOptions extends AbstractConstructorOptions {
  game: string;
  baseJson?: JSON;
}

interface BaseInterface {
  debug: boolean;
}

interface FetchRequestBody {
  body?: JSON;
  data?: JSON;
}

interface FetchOptions {
  path: string;
  body?: FetchRequestBody;
}

interface FetchResponse {
  serverTime: number;
  result: string;
  errorMessage?: string;
}

interface getUserDataOpts {
  privateProfile?: boolean;
  publicProfile?: boolean;
  achievementSystem?: boolean;
  payments?: boolean;
  userId?: string;
}

export type {
  AbstractConstructorOptions,
  ApiRequestBody,
  BaseConstructorOptions,
  BaseInterface,
  FetchOptions,
  FetchRequestBody,
  FetchResponse,
  getUserDataOpts,
  JSON,
};
