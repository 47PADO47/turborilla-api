import { afterEach, describe, expect, mock, test } from "bun:test";

import { MX2 } from "../src/index";
import { mockFetch } from "./fetch-mock";

const BASE_URL = "https://production-dot-turborillanet.appspot.com/";

afterEach(() => {
  mock.restore();
});

describe("Base request envelope", () => {
  test("posts a json-encoded body with the shared envelope", async () => {
    const { calls } = mockFetch({ result: "SUCCESS", serverTime: 1 });

    await new MX2({ userId: "u1" }).getServerTime();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(`${BASE_URL}getservertime`);
    expect(calls[0]?.body).toMatchObject({
      data: { userId: "u1" },
      game: "madskillsmotocross2-release",
      platform: "ios",
      version: "1.0",
    });
  });

  test("getServerTime returns the serverTime field", async () => {
    mockFetch({ result: "SUCCESS", serverTime: 1234 });

    const time = await new MX2({ userId: "u1" }).getServerTime();

    expect(time).toBe(1234);
  });

  test("marks the client authenticated and sends the password when given", async () => {
    const client = new MX2({ password: "secret", userId: "u1" });
    expect(client.authenticated).toBe(true);

    const { calls } = mockFetch();
    await client.getServerTime();

    expect(calls[0]?.body.data).toMatchObject({ password: "secret" });
  });

  test("is a guest client without a password", () => {
    expect(new MX2({ userId: "u1" }).authenticated).toBe(false);
  });
});

describe("Base error handling", () => {
  test("rejects when result is not SUCCESS", async () => {
    mockFetch({ errorMessage: "nope", result: "FAILED" });

    await expect(new MX2({ userId: "u1" }).getServerTime()).rejects.toThrow(
      "nope"
    );
  });

  test("rejects on a non-ok response", async () => {
    mockFetch({ result: "SUCCESS" }, { status: 500 });

    await expect(new MX2({ userId: "u1" }).getServerTime()).rejects.toThrow(
      "Response not ok"
    );
  });

  test("rejects when the body is not valid json", async () => {
    mockFetch({}, { raw: "<<not json>>" });

    await expect(new MX2({ userId: "u1" }).getServerTime()).rejects.toThrow(
      "could not parse json"
    );
  });
});

describe("Base endpoints", () => {
  test("getUserAvatar sends the userId", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getUserAvatar("target-id");

    expect(calls[0]?.url).toBe(`${BASE_URL}getuseravatar`);
    expect(calls[0]?.body.data).toMatchObject({ userId: "target-id" });
  });

  test("isFollowing sends an array of userIds", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).isFollowing(["a", "b"]);

    expect(calls[0]?.url).toBe(`${BASE_URL}isfollowing`);
    expect(calls[0]?.body.data).toMatchObject({ userIds: ["a", "b"] });
  });

  test("getRankFromScore forwards the option object", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getRankFromScore({
      boardIds: ["board-1"],
      lightweight: false,
      preciseRankLimit: 100,
    });

    expect(calls[0]?.url).toBe(`${BASE_URL}getrankfromscore`);
    expect(calls[0]?.body.data).toMatchObject({
      boardIds: ["board-1"],
      lightweight: false,
      preciseRankLimit: 100,
    });
  });

  test("getBetterHighscore defaults referenceScore to null", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getBetterHighscore("board-1");

    expect(calls[0]?.body.data).toMatchObject({
      boardId: "board-1",
      referenceScore: null,
    });
  });

  test("getJamRound sends the roundId", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getJamRound("round-1");

    expect(calls[0]?.url).toBe(`${BASE_URL}jam/getround`);
    expect(calls[0]?.body.data).toMatchObject({ roundId: "round-1" });
  });

  test("finishPvpChallenge forwards the option object", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).finishPvpChallenge({
      challengeId: "c1",
      pairingNumber: 8,
      secondaryPairingNumber: 4,
    });

    expect(calls[0]?.url).toBe(`${BASE_URL}pvp/finishchallenge`);
    expect(calls[0]?.body.data).toMatchObject({
      challengeId: "c1",
      pairingNumber: 8,
      secondaryPairingNumber: 4,
    });
  });

  test("getPvpBadges is a no-argument POST", async () => {
    const { calls } = mockFetch();

    await new MX2({ userId: "u1" }).getPvpBadges();

    expect(calls[0]?.url).toBe(`${BASE_URL}pvp/getbadges`);
  });
});
