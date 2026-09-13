import { afterEach, describe, expect, mock, test } from "bun:test";

import { MX2 } from "../src/index";
import { mockFetch } from "./fetch-mock";

const BASE_URL = "https://production-dot-turborillanet.appspot.com/";

afterEach(() => {
  mock.restore();
});

describe("MX2", () => {
  test("uses the madskillsmotocross2 game id", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getServerTime();

    expect(calls[0]?.body).toMatchObject({
      game: "madskillsmotocross2-release",
    });
  });

  test("extends the user-data key map with dailyDash", () => {
    const mappings = new MX2({ userId: "u1" }).getUserDataMappings();

    expect(mappings).toMatchObject({
      dailyDash: "dailydash",
      privateProfile: "private-profile",
      publicProfile: "public-profile",
    });
  });

  test("getUserData maps enabled flags to keys and applies userId", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getUserData({
      dailyDash: true,
      privateProfile: true,
      userId: "other",
    });

    expect(calls[0]?.url).toBe(`${BASE_URL}getuserdata`);
    expect(calls[0]?.body).toMatchObject({ userId: "other" });
    expect(calls[0]?.body.data).toMatchObject({
      keys: expect.arrayContaining(["private-profile", "dailydash"]),
    });
    // userId stays at the top level, never inside data.
    expect(calls[0]?.body.data).not.toHaveProperty("userId");
  });
});
