import { describe, expect, test } from "bun:test";

import { ENVELOPE_DEFAULTS } from "../src/constants";
import { buildEnvelope, encodeBody } from "../src/envelope";
import type { GameDefinition } from "../src/games/definition";

const game: GameDefinition = {
  id: "testgame",
  userDataSections: { publicProfile: "public-profile" },
};

describe("buildEnvelope", () => {
  test("builds a guest envelope without userId or password", () => {
    const envelope = buildEnvelope({ game });

    expect(envelope).toEqual({
      ...ENVELOPE_DEFAULTS,
      data: {},
      game: "testgame-release",
    });
    expect("userId" in envelope).toBe(false);
    expect("password" in envelope).toBe(false);
  });

  test("puts credentials at the top level, not inside data", () => {
    const envelope = buildEnvelope({
      credentials: { password: "p", userId: "u" },
      data: { boardId: "b" },
      game,
    });

    expect(envelope).toMatchObject({
      data: { boardId: "b" },
      password: "p",
      userId: "u",
    });
  });

  test("sends only the userId when no password is given", () => {
    const envelope = buildEnvelope({ credentials: { userId: "u" }, game });

    expect(envelope.userId).toBe("u");
    expect("password" in envelope).toBe(false);
  });

  test("merges game extras and client overrides in order", () => {
    const envelope = buildEnvelope({
      game: { ...game, envelope: { includeUserDataSession: true } },
      overrides: { extra: 1, platform: "android" },
    });

    expect(envelope).toMatchObject({
      extra: 1,
      game: "testgame-release",
      includeUserDataSession: true,
      platform: "android",
    });
  });

  test("overrides cannot replace the derived game id", () => {
    const envelope = buildEnvelope({ game, overrides: { game: "other" } });

    expect(envelope.game).toBe("testgame-release");
  });
});

describe("encodeBody", () => {
  test("form-encodes the envelope under the json key", () => {
    const envelope = buildEnvelope({ data: { a: "x y" }, game });
    const body = encodeBody(envelope);

    expect(body.startsWith("json=")).toBe(true);
    expect(JSON.parse(decodeURIComponent(body.slice("json=".length)))).toEqual(
      envelope
    );
  });
});
