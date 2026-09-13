import { afterEach, describe, expect, mock, test } from "bun:test";

import { BMX2 } from "../src/index";
import { mockFetch } from "./fetch-mock";

const BASE_URL = "https://production-dot-turborillanet.appspot.com/";

afterEach(() => {
  mock.restore();
});

describe("BMX2", () => {
  test("uses the bmx2 game id and includeUserDataSession envelope", async () => {
    const { calls } = mockFetch();

    await new BMX2({ userId: "u1" }).getServerTime();

    expect(calls[0]?.body).toMatchObject({
      game: "bmx2-release",
      includeUserDataSession: true,
    });
  });

  test("getGameConfig hits the config endpoint", async () => {
    const { calls } = mockFetch();

    await new BMX2({ userId: "u1" }).getGameConfig();

    expect(calls[0]?.url).toBe(`${BASE_URL}app/madskillsmx2/config.json`);
  });
});
