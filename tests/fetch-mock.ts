import { spyOn } from "bun:test";

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

interface FetchCall {
  url: string;
  body: { [key: string]: JsonLike };
}

interface MockResponseMeta {
  status?: number;
  statusText?: string;
  /** Raw response body; overrides `payload` (used to simulate invalid JSON). */
  raw?: string;
}

/**
 * Replace the global `fetch` with a spy that records each request (URL and the
 * decoded `json=` envelope) and returns a canned Response. Restore with
 * `mock.restore()` in an afterEach.
 */
export const mockFetch = (
  payload?: { [key: string]: JsonLike },
  meta: MockResponseMeta = {}
) => {
  const calls: FetchCall[] = [];
  const responsePayload = payload ?? { result: "SUCCESS" };

  const spy = spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    const encoded = String(init?.body ?? "").replace(/^json=/u, "");
    const body = encoded ? JSON.parse(decodeURIComponent(encoded)) : {};
    calls.push({ body, url });

    const responseBody = meta.raw ?? JSON.stringify(responsePayload);
    return Promise.resolve(
      new Response(responseBody, {
        status: meta.status ?? 200,
        statusText: meta.statusText ?? "OK",
      })
    );
  });

  return { calls, spy };
};
