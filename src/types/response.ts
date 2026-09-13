export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

/** An object type with no known keys (the bare `{}` type is banned by the linter). */
export type EmptyObject = Record<never, never>;

/** A string union that keeps autocomplete while still accepting any other string. */
export type OpenString<T extends string> = T | (string & Record<never, never>);

/** Fields present on every response and validated by the client. */
export interface ApiResponseBase {
  result: OpenString<"SUCCESS">;
  errorMessage?: string;
}

/** Fields the wrapper does not model are still reachable through bracket access. */
export interface UnknownFields {
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- undocumented API fields are `unknown` by definition; callers narrow them
  [key: string]: unknown;
}

/** Returned by every backend POST endpoint. */
export interface ServerTimeFields {
  serverTime: number;
}

/**
 * A backend response: the validated base fields, the documented fields `TData`,
 * and a string index signature for everything the API returns but this wrapper
 * does not (yet) document.
 */
export type ApiResponse<TData extends object = ServerTimeFields> =
  ApiResponseBase & TData & UnknownFields;
