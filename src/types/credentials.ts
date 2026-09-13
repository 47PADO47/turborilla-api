import type { EmptyObject } from "./response";

export interface Credentials {
  userId: string;
  /** Required for authenticated (user) endpoints; guests only carry a `userId`. */
  password?: string;
}

/**
 * `public` endpoints never need credentials (they are accepted and forwarded
 * when present); `user` endpoints require them, either bound to the client or
 * passed per call.
 */
export type Access = "public" | "user";

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface OptionalCredentialsParam {
  credentials?: Credentials;
}

export interface RequiredCredentialsParam {
  credentials: Credentials;
}

/**
 * Whether `credentials` is required in a call. Non-distributive on purpose: a
 * client created with `Credentials | undefined` must behave as unbound.
 */
export type CredentialsParam<
  TCredentials,
  TAccess extends Access,
> = TAccess extends "public"
  ? OptionalCredentialsParam
  : [TCredentials] extends [Credentials]
    ? OptionalCredentialsParam
    : RequiredCredentialsParam;

/** The single params object every endpoint method accepts. */
export type CallParams<
  TCredentials,
  TAccess extends Access,
  TParams extends object = EmptyObject,
> = TParams & CredentialsParam<TCredentials, TAccess> & RequestOptions;

/**
 * The argument tuple of an endpoint method: the params object becomes optional
 * when nothing inside it is required.
 */
export type CallArgs<
  TCredentials,
  TAccess extends Access,
  TParams extends object = EmptyObject,
> =
  object extends CallParams<TCredentials, TAccess, TParams>
    ? [params?: CallParams<TCredentials, TAccess, TParams>]
    : [params: CallParams<TCredentials, TAccess, TParams>];
