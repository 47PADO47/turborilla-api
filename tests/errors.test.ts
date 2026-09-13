import { describe, expect, test } from "bun:test";

import { TurborillaError } from "../src/errors";

describe("TurborillaError", () => {
  test("exposes the code and details", () => {
    const cause = new Error("boom");
    const error = new TurborillaError("failed", {
      cause,
      code: "HTTP_ERROR",
      status: 500,
      url: "https://example.test/x",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("TurborillaError");
    expect(error.message).toBe("failed");
    expect(error.code).toBe("HTTP_ERROR");
    expect(error.status).toBe(500);
    expect(error.url).toBe("https://example.test/x");
    expect(error.cause).toBe(cause);
  });
});
