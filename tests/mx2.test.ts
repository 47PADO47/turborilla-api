import { describe, expect, test } from "bun:test";

import { DEFAULT_BASE_URL } from "../src/constants";
import { MX2, mx2Game } from "../src/games/mx2";
import { createFetchMock } from "./fetch-mock";

describe("MX2", () => {
  test("uses the madskillsmotocross2 game id", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getCurrentEvent();

    expect(calls[0]?.body).toMatchObject({
      game: "madskillsmotocross2-release",
    });
  });

  test("extends the shared user-data sections", () => {
    expect(mx2Game.userDataSections).toMatchObject({
      dailyDash: "dailydash",
      privateProfile: "private-profile",
      publicProfile: "public-profile",
      trackPacks: "track-packs",
    });
  });

  test("getUserData reads another user as a guest with userId inside data", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getUserData({
      keys: ["some-undocumented-key"],
      sections: ["dailyDash", "privateProfile"],
      userId: "other",
    });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}getuserdata`);
    // The target userId travels inside data, and no credentials are sent.
    expect(calls[0]?.body?.["data"]).toEqual({
      keys: ["dailydash", "private-profile", "some-undocumented-key"],
      userId: "other",
    });
    expect(calls[0]?.body).not.toHaveProperty("userId");
    expect(calls[0]?.body).not.toHaveProperty("password");
  });

  test("getUserData reading another user drops bound credentials (guest call)", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({
      credentials: { password: "p", userId: "me" },
      fetch,
    }).getUserData({ sections: ["purchases"], userId: "other" });

    expect(calls[0]?.body?.["data"]).toEqual({
      keys: ["Purchases"],
      userId: "other",
    });
    expect(calls[0]?.body).not.toHaveProperty("password");
    expect(calls[0]?.body).not.toHaveProperty("userId");
  });

  test("getUserData reads the caller with credentials and keys only", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({
      credentials: { password: "p", userId: "me" },
      fetch,
    }).getUserData({ sections: ["publicProfile", "privateProfile"] });

    expect(calls[0]?.body).toMatchObject({ password: "p", userId: "me" });
    expect(calls[0]?.body?.["data"]).toEqual({
      keys: ["public-profile", "private-profile"],
    });
  });

  test("getUserData omits credentials for a guest self-read", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getUserData({ sections: ["publicProfile"] });

    expect(calls[0]?.body?.["data"]).toEqual({ keys: ["public-profile"] });
    expect(calls[0]?.body).not.toHaveProperty("userId");
  });
});
