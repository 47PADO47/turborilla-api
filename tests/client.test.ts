import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

import { Logger } from "@padosoft/logger";

import { DEFAULT_BASE_URL } from "../src/constants";
import { TurborillaError } from "../src/errors";
import { MX2 } from "../src/games/mx2";
import { createFetchMock, mockFetch } from "./fetch-mock";

const credentials = { password: "secret", userId: "u1" };

afterEach(() => {
  mock.restore();
});

describe("request envelope", () => {
  test("public endpoints on an unbound client send no credentials at all", async () => {
    const { calls, fetch } = createFetchMock({
      result: "SUCCESS",
      serverTime: 1,
    });

    await new MX2({ fetch }).getServerTime();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}getservertime`);
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.headers["content-type"]).toBe(
      "application/x-www-form-urlencoded"
    );
    expect(calls[0]?.headers["user-agent"]).toContain("MadSkillsMX");
    expect(calls[0]?.body).toMatchObject({
      data: {},
      game: "madskillsmotocross2-release",
      platform: "ios",
      version: "1.0",
    });
    expect(calls[0]?.body).not.toHaveProperty("userId");
    expect(calls[0]?.body).not.toHaveProperty("password");
  });

  test("bound credentials go to the envelope top level, params go under data", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ credentials, fetch }).getBestScores({ boardIds: ["b1"] });

    expect(calls[0]?.body).toMatchObject({
      data: { boardIds: ["b1"] },
      password: "secret",
      userId: "u1",
    });
    expect(calls[0]?.body?.["data"]).not.toHaveProperty("credentials");
  });

  test("bound credentials are also forwarded on public endpoints", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ credentials, fetch }).getUserAvatar({ userId: "other" });

    expect(calls[0]?.body).toMatchObject({
      data: { userId: "other" },
      userId: "u1",
    });
  });

  test("per-call credentials win over bound ones", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ credentials, fetch }).getBestScores({
      boardIds: ["b1"],
      credentials: { password: "p2", userId: "u2" },
    });

    expect(calls[0]?.body).toMatchObject({ password: "p2", userId: "u2" });
  });

  test("an unbound client accepts credentials per call", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getPvpBadges({ credentials });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}pvp/getbadges`);
    expect(calls[0]?.body).toMatchObject({ password: "secret", userId: "u1" });
  });

  test("user endpoints reject with MISSING_CREDENTIALS before any request", async () => {
    const { calls, fetch } = createFetchMock();
    const client = new MX2({ fetch });

    // @ts-expect-error deliberately violating the contract to test the runtime guard
    const promise = client.getBestScores({ boardIds: ["b1"] });

    await expect(promise).rejects.toMatchObject({
      code: "MISSING_CREDENTIALS",
    });
    expect(calls).toHaveLength(0);
  });

  test("the signal is forwarded to fetch and stripped from the payload", async () => {
    const { calls, fetch } = createFetchMock();
    const controller = new AbortController();

    await new MX2({ fetch }).getUserAvatar({
      signal: controller.signal,
      userId: "x",
    });

    expect(calls[0]?.signal).toBe(controller.signal);
    expect(calls[0]?.body?.["data"]).toEqual({ userId: "x" });
  });

  test("getHighscoreAtScore is public and sends boardId with referenceScore", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getHighscoreAtScore({
      boardId: "div1_3-5",
      referenceScore: 41_026_556,
    });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}gethighscoreatscore`);
    expect(calls[0]?.body?.["data"]).toEqual({
      boardId: "div1_3-5",
      referenceScore: 41_026_556,
    });
    expect(calls[0]?.body).not.toHaveProperty("userId");
    expect(calls[0]?.body).not.toHaveProperty("password");
  });

  test("getHighscores is public and defaults userId to null", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getHighscores({ boardIds: ["tutorial_1-5"] });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}gethighscores`);
    expect(calls[0]?.body?.["data"]).toEqual({
      boardIds: ["tutorial_1-5"],
      userId: null,
    });
    expect(calls[0]?.body).not.toHaveProperty("userId");
  });

  test("getHighscores can target another user by userId", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).getHighscores({
      boardIds: ["tutorial_1-5"],
      userId: "other",
    });

    expect(calls[0]?.body?.["data"]).toEqual({
      boardIds: ["tutorial_1-5"],
      userId: "other",
    });
  });

  test("isConnected is public and fills unset providers with null", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).isConnected({ appleId: "apple-123" });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}isconnected`);
    expect(calls[0]?.body?.["data"]).toEqual({
      appFacebookId: null,
      appleId: "apple-123",
      email: null,
      facebookAccessToken: null,
      facebookId: null,
      gameCenterId: null,
      gameCircleId: null,
      googlePlayId: null,
      legacyGameCenterId: null,
      steamId: null,
      twitterId: null,
    });
    expect(calls[0]?.body).not.toHaveProperty("userId");
  });

  test("loginApple is a public POST to login/apple", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ fetch }).loginApple({
      appleId: "apple-123",
      email: "x@privaterelay.appleid.com",
      timeZone: "GMT+2",
    });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}login/apple`);
    expect(calls[0]?.body?.["data"]).toEqual({
      appleId: "apple-123",
      email: "x@privaterelay.appleid.com",
      timeZone: "GMT+2",
    });
    expect(calls[0]?.body).not.toHaveProperty("password");
  });

  test("getFollowing and setUserDataSession are user endpoints", async () => {
    const { calls, fetch } = createFetchMock();
    const client = new MX2({ credentials, fetch });

    await client.getFollowing({ cursor: null, pageSize: 50 });
    await client.setUserDataSession({
      gameVersionNumber: 42,
      lastTimestamp: 0,
      ownerId: "owner-1",
    });

    expect(calls[0]?.url).toBe(`${DEFAULT_BASE_URL}getfollowing`);
    expect(calls[0]?.body?.["data"]).toEqual({ cursor: null, pageSize: 50 });
    expect(calls[1]?.url).toBe(`${DEFAULT_BASE_URL}setuserdatasession`);
    expect(calls[1]?.body?.["data"]).toEqual({
      gameVersionNumber: 42,
      lastTimestamp: 0,
      ownerId: "owner-1",
    });
    expect(calls[1]?.body).toMatchObject({ password: "secret", userId: "u1" });
  });

  test("setUserData forwards the wallet and session metadata", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({ credentials, fetch }).setUserData({
      data: { "public-profile": "{}" },
      gameVersionNumber: 42,
      isPublic: { "public-profile": true },
      level: 1,
      ownerId: "owner-1",
      wallet: { newRealMoneyPurchases: { installId: "i-1", sendCount: 0 } },
    });

    expect(calls[0]?.body?.["data"]).toEqual({
      data: { "public-profile": "{}" },
      gameVersionNumber: 42,
      isPublic: { "public-profile": true },
      level: 1,
      ownerId: "owner-1",
      wallet: { newRealMoneyPurchases: { installId: "i-1", sendCount: 0 } },
    });
  });

  test("applies default payload values", async () => {
    const { calls, fetch } = createFetchMock();
    const client = new MX2({ credentials, fetch });

    await client.getBetterHighscore({ boardId: "b" });
    await client.isUsernameAvailable({ username: "n" });
    await client.getUser({ username: "n" });

    expect(calls[0]?.body?.["data"]).toEqual({
      boardId: "b",
      referenceScore: null,
    });
    expect(calls[1]?.body?.["data"]).toEqual({
      suggestAlternatives: true,
      username: "n",
    });
    expect(calls[2]?.body?.["data"]).toEqual({ userId: null, username: "n" });
  });

  test("honours baseUrl, headers and envelope overrides", async () => {
    const { calls, fetch } = createFetchMock();

    await new MX2({
      baseUrl: "https://staging.test/",
      envelope: { extra: true, platform: "android" },
      fetch,
      headers: { "X-Custom": "1" },
    }).getCurrentEvent();

    expect(calls[0]?.url).toBe("https://staging.test/getcurrentevent");
    expect(calls[0]?.headers["x-custom"]).toBe("1");
    expect(calls[0]?.body).toMatchObject({ extra: true, platform: "android" });
  });

  test("falls back to the global fetch when none is injected", async () => {
    const { calls } = mockFetch({ result: "SUCCESS", serverTime: 42 });

    const time = await new MX2().getServerTime();

    expect(time).toBe(42);
    expect(calls).toHaveLength(1);
  });

  test("authenticated reflects a bound password", () => {
    expect(new MX2({ credentials }).authenticated).toBe(true);
    expect(new MX2({ credentials: { userId: "u" } }).authenticated).toBe(false);
    expect(new MX2().authenticated).toBe(false);
  });
});

describe("response validation", () => {
  test("rejects with API_ERROR when result is not SUCCESS", async () => {
    const { fetch } = createFetchMock({
      errorMessage: "nope",
      result: "FAILED",
    });
    const promise = new MX2({ fetch }).getCurrentEvent();

    await expect(promise).rejects.toBeInstanceOf(TurborillaError);
    await expect(promise).rejects.toMatchObject({
      code: "API_ERROR",
      errorMessage: "nope",
      message: "nope (FAILED)",
      result: "FAILED",
    });
  });

  test("rejects with API_ERROR when an errorMessage accompanies SUCCESS", async () => {
    const { fetch } = createFetchMock({
      errorMessage: "soft fail",
      result: "SUCCESS",
    });

    await expect(new MX2({ fetch }).getCurrentEvent()).rejects.toMatchObject({
      code: "API_ERROR",
    });
  });

  test("rejects with HTTP_ERROR on a non-ok status", async () => {
    const { fetch } = createFetchMock({ result: "SUCCESS" }, { status: 500 });

    await expect(new MX2({ fetch }).getCurrentEvent()).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 500,
    });
  });

  test("rejects with INVALID_JSON on a non-JSON body", async () => {
    const { fetch } = createFetchMock(undefined, { raw: "<<not json>>" });

    await expect(new MX2({ fetch }).getCurrentEvent()).rejects.toMatchObject({
      code: "INVALID_JSON",
    });
  });

  test("rejects with INVALID_JSON on a non-object JSON body", async () => {
    const { fetch } = createFetchMock(undefined, { raw: "42" });

    await expect(new MX2({ fetch }).getCurrentEvent()).rejects.toMatchObject({
      code: "INVALID_JSON",
    });
  });

  test("exposes undocumented response fields through bracket access", async () => {
    const { fetch } = createFetchMock({
      challenges: [{ id: 1 }],
      result: "SUCCESS",
      serverTime: 7,
    });

    const response = await new MX2({ credentials, fetch }).getPvpChallenges();

    expect(response.serverTime).toBe(7);
    expect(response["challenges"]).toEqual([{ id: 1 }]);
  });
});

describe("logger", () => {
  test("logs requests at debug level and failures at error level", async () => {
    const logger = new Logger({ level: "debug" });
    const debug = spyOn(logger, "debug");
    const error = spyOn(logger, "error");
    const { fetch } = createFetchMock({ errorMessage: "x", result: "FAILED" });
    const client = new MX2({ fetch, logger });

    await expect(client.getCurrentEvent()).rejects.toBeInstanceOf(
      TurborillaError
    );

    expect(debug).toHaveBeenCalledTimes(1);
    expect(String(debug.mock.calls[0]?.[0])).toContain("/getcurrentevent");
    expect(error).toHaveBeenCalledTimes(1);
  });
});
