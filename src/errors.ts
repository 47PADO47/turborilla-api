export type TurborillaErrorCode =
  /** The backend answered with a `result` other than `SUCCESS` or with an `errorMessage`. */
  | "API_ERROR"
  /** The HTTP response was not 2xx. */
  | "HTTP_ERROR"
  /** The response body could not be parsed as JSON or had an unexpected shape. */
  | "INVALID_JSON"
  /** A user endpoint was called without bound or per-call credentials. */
  | "MISSING_CREDENTIALS";

export interface TurborillaErrorDetails {
  code: TurborillaErrorCode;
  url?: string | undefined;
  status?: number | undefined;
  result?: string | undefined;
  errorMessage?: string | undefined;
  cause?: unknown;
}

/** Error thrown by every client method. Inspect `code` to branch on the failure kind. */
export class TurborillaError extends Error {
  override readonly name = "TurborillaError";
  readonly code: TurborillaErrorCode;
  readonly url: string | undefined;
  readonly status: number | undefined;
  readonly result: string | undefined;
  readonly errorMessage: string | undefined;

  constructor(message: string, details: TurborillaErrorDetails) {
    super(message, { cause: details.cause });
    this.code = details.code;
    this.url = details.url;
    this.status = details.status;
    this.result = details.result;
    this.errorMessage = details.errorMessage;
  }
}
