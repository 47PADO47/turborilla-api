import { describe, expect, test } from "bun:test";

import { Assets, dailyDashPath } from "../src/assets";
import { DEFAULT_ASSETS_BASE_URL, DEFAULT_BASE_URL } from "../src/constants";
import { TurborillaError } from "../src/errors";
import { createFetchMock } from "./fetch-mock";

const day = { day: 13, month: 9, year: 2026 };

describe("Assets URL builders", () => {
  const assets = new Assets();

  test("dailyDashPath pads the month and leaves the day unpadded", () => {
    expect(dailyDashPath(day)).toBe(
      "dailydash/2026-09/dailydash-2026-09-day-13"
    );
    expect(dailyDashPath({ day: 1, month: 12, year: 2027 })).toBe(
      "dailydash/2027-12/dailydash-2027-12-day-1"
    );
  });

  test("builds every asset URL from the base URL", () => {
    expect(assets.skinsManifestUrl()).toBe(
      `${DEFAULT_ASSETS_BASE_URL}skins/skins.json`
    );
    expect(assets.skinUrl({ skinId: "bike100193" })).toBe(
      `${DEFAULT_ASSETS_BASE_URL}skins/bike100193.zip`
    );
    expect(assets.languageUrl({ language: "EN" })).toBe(
      `${DEFAULT_ASSETS_BASE_URL}languages/EN.json`
    );
    expect(assets.dailyDashSeasonUrl(day)).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/season.json`
    );
    expect(assets.dailyDashDayUrl(day)).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/dailydash-2026-09-day-13.json`
    );
    expect(assets.dailyDashTrackUrl(day)).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/dailydash-2026-09-day-13.trk`
    );
    expect(assets.dailyDashReplayUrl({ ...day, index: 2 })).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/dailydash-2026-09-day-13-2.replay`
    );
  });

  test("builds flag URLs from the backend host, lower-casing the code", () => {
    expect(assets.flagUrl({ code: "AR" })).toBe(
      `${DEFAULT_BASE_URL}flags/png250px/ar.png`
    );
    expect(assets.flagUrl({ code: "us", size: 250 })).toBe(
      `${DEFAULT_BASE_URL}flags/png250px/us.png`
    );
  });

  test("honours a custom base URL", () => {
    const custom = new Assets({ baseUrl: "https://cdn.test/" });

    expect(custom.skinsManifestUrl()).toBe("https://cdn.test/skins/skins.json");
  });

  test("honours a custom flags base URL", () => {
    const custom = new Assets({ flagsBaseUrl: "https://flags.test/" });

    expect(custom.flagUrl({ code: "AR" })).toBe(
      "https://flags.test/flags/png250px/ar.png"
    );
  });
});

describe("Assets downloads", () => {
  test("getSkinsManifest issues a GET with the game headers and parses JSON", async () => {
    const { calls, fetch } = createFetchMock({
      versions: { bike100193: 4 },
    });

    const manifest = await new Assets({ fetch }).getSkinsManifest();

    expect(manifest.versions["bike100193"]).toBe(4);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.body).toBeUndefined();
    expect(calls[0]?.headers["user-agent"]).toContain("MadSkillsMX");
    expect(calls[0]?.headers["x-unity-version"]).toBeDefined();
  });

  test("getDailyDashSeason and getDailyDashDay hit the dated paths", async () => {
    const { calls, fetch } = createFetchMock({
      month: 9,
      prizes: [],
      year: 2026,
    });
    const assets = new Assets({ fetch });

    const season = await assets.getDailyDashSeason({ month: 9, year: 2026 });
    await assets.getDailyDashDay(day);

    expect(season.year).toBe(2026);
    expect(calls[0]?.url).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/season.json`
    );
    expect(calls[1]?.url).toBe(
      `${DEFAULT_ASSETS_BASE_URL}dailydash/2026-09/dailydash-2026-09-day-13.json`
    );
  });

  test("binary downloads return the raw bytes", async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const { fetch } = createFetchMock(undefined, {
      headers: { "content-type": "application/zip" },
      raw: bytes,
    });

    const zip = await new Assets({ fetch }).downloadSkin({
      skinId: "bike100193",
    });

    expect(new Uint8Array(zip)).toEqual(bytes);
  });

  test("downloadFlag fetches the flag PNG from the backend host", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const { calls, fetch } = createFetchMock(undefined, {
      headers: { "content-type": "image/png" },
      raw: bytes,
    });

    const png = await new Assets({ fetch }).downloadFlag({ code: "AR" });

    expect(new Uint8Array(png)).toEqual(bytes);
    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}flags/png250px/ar.png`);
  });

  test("forwards the abort signal", async () => {
    const { calls, fetch } = createFetchMock();
    const controller = new AbortController();

    await new Assets({ fetch }).downloadDailyDashReplay({
      ...day,
      index: 1,
      signal: controller.signal,
    });

    expect(calls[0]?.signal).toBe(controller.signal);
  });

  test("rejects with HTTP_ERROR on a 404", async () => {
    const { fetch } = createFetchMock(undefined, {
      raw: "<Error/>",
      status: 404,
      statusText: "Not Found",
    });

    const promise = new Assets({ fetch }).downloadSkin({ skinId: "bike14" });

    await expect(promise).rejects.toBeInstanceOf(TurborillaError);
    await expect(promise).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 404,
    });
  });

  test("rejects with INVALID_JSON when a manifest is not JSON", async () => {
    const { fetch } = createFetchMock(undefined, { raw: "<<nope>>" });

    await expect(
      new Assets({ fetch }).getSkinsManifest()
    ).rejects.toMatchObject({ code: "INVALID_JSON" });
  });
});
