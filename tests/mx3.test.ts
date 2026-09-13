import { describe, expect, test } from "bun:test";

import { MX3_ASSETS_BASE_URL } from "../src/constants";
import { MX3, mx3Game } from "../src/games/mx3";
import { createFetchMock } from "./fetch-mock";

describe("MX3", () => {
  test("uses the madskillsmotocross3 game id", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX3({ fetch }).getCurrentEvent();

    expect(calls[0]?.body).toMatchObject({
      game: "madskillsmotocross3-release",
    });
  });

  test("defaults its assets client to the MX3 CDN", () => {
    expect(mx3Game.assetsBaseUrl).toBe(MX3_ASSETS_BASE_URL);
    expect(new MX3().assets.skinsManifestUrl()).toBe(
      `${MX3_ASSETS_BASE_URL}skins/skins.json`
    );
  });

  test("a per-client assetsBaseUrl still overrides the game default", () => {
    const client = new MX3({ assetsBaseUrl: "https://cdn.test/" });

    expect(client.assets.skinsManifestUrl()).toBe(
      "https://cdn.test/skins/skins.json"
    );
  });
});
