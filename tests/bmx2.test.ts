import { describe, expect, test } from "bun:test";

import { DEFAULT_BASE_URL } from "../src/constants";
import { BMX2 } from "../src/games/bmx2";
import { createFetchMock } from "./fetch-mock";

describe("BMX2", () => {
  test("uses the bmx2 game id and the includeUserDataSession envelope", async () => {
    const { calls, fetch } = createFetchMock();

    await new BMX2({ fetch }).getCurrentEvent();

    expect(calls[0]?.body).toMatchObject({
      game: "bmx2-release",
      includeUserDataSession: true,
    });
  });

  test("getGameConfig is a body-less GET and exposes the documented fields", async () => {
    const { calls, fetch } = createFetchMock({
      enabled: false,
      resources: {},
      result: "SUCCESS",
    });

    const config = await new BMX2({ fetch }).getGameConfig();

    expect(calls[0]?.url).toBe(
      `${DEFAULT_BASE_URL}app/madskillsmx2/config.json`
    );
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.body).toBeUndefined();
    expect(config.enabled).toBe(false);
    expect(config.resources).toEqual({});
  });
});
