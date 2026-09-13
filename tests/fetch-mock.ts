import { spyOn } from "bun:test";

import type { FetchLike } from "../src/assets";

export type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  /** The decoded `json=` envelope, or `undefined` for body-less requests. */
  body: { [key: string]: JsonLike } | undefined;
  signal: AbortSignal | null | undefined;
}

export interface MockResponseMeta {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  /** Raw response body; overrides `payload` (invalid JSON, binaries, ...). */
  raw?: string | ArrayBuffer | Uint8Array;
}

const JSON_PREFIX = /^json=/u;

const toRecord = (headers: RequestInit["headers"]) =>
  Object.fromEntries(new Headers(headers));

const decodeEnvelope = (body: RequestInit["body"]): RecordedCall["body"] => {
  const encoded = String(body ?? "").replace(JSON_PREFIX, "");
  return encoded ? JSON.parse(decodeURIComponent(encoded)) : undefined;
};

/**
 * Build an injectable `fetch` that records each request (URL, method, headers,
 * decoded envelope, signal) and answers with a canned Response.
 */
export const createFetchMock = (
  payload?: { [key: string]: JsonLike },
  meta: MockResponseMeta = {}
) => {
  const calls: RecordedCall[] = [];
  const responsePayload = payload ?? { result: "SUCCESS" };

  const fetch: FetchLike = (input, init) => {
    calls.push({
      body: decodeEnvelope(init?.body),
      headers: toRecord(init?.headers),
      method: init?.method ?? "GET",
      signal: init?.signal,
      url: String(input),
    });

    const responseBody = meta.raw ?? JSON.stringify(responsePayload);
    return Promise.resolve(
      new Response(responseBody, {
        headers: meta.headers ?? { "content-type": "application/json" },
        status: meta.status ?? 200,
        statusText: meta.statusText ?? "OK",
      })
    );
  };

  return { calls, fetch };
};

/**
 * Replace the global `fetch` with a recording spy. Restore with
 * `mock.restore()` in an afterEach.
 */
export const mockFetch = (
  payload?: { [key: string]: JsonLike },
  meta: MockResponseMeta = {}
) => {
  const { calls, fetch } = createFetchMock(payload, meta);
  // SAFETY: the spy only ever invokes the function; `fetch.preconnect` is never used by the clients under test.
  const spy = spyOn(globalThis, "fetch").mockImplementation(
    fetch as typeof globalThis.fetch
  );
  return { calls, spy };
};
