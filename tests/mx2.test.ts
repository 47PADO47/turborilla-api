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

  test("getUserData maps sections to backend keys and forwards raw keys", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getUserData({
      keys: ["some-undocumented-key"],
      sections: ["dailyDash", "privateProfile"],
      userId: "other",
    });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}getuserdata`);
    expect(calls[0]?.body?.["data"]).toEqual({
      keys: ["dailydash", "private-profile", "some-undocumented-key"],
      userId: "other",
    });
  });

  test("getUserData omits userId when not given", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getUserData({ sections: ["publicProfile"] });

    expect(calls[0]?.body?.["data"]).toEqual({ keys: ["public-profile"] });
  });
});
