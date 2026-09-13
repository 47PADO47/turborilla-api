import { describe, expect, expectTypeOf, test } from "bun:test";

import { BMX2 } from "../src/games/bmx2";
import { MX2 } from "../src/games/mx2";
import type { Credentials } from "../src/types/credentials";
import type { ApiResponse } from "../src/types/response";

const credentials: Credentials = { password: "p", userId: "u" };
const bound = new MX2({ credentials });
const unbound = new MX2();
const maybeCredentials = Math.random() > 1 ? credentials : undefined;
const maybe = new MX2({ credentials: maybeCredentials });

// Never executed: these calls exist only to be type-checked by `tsc`.
const typeChecks = async () => {
  // Bound client: endpoint params only, credentials optional everywhere.
  await bound.getServerTime();
  await bound.getBestScores({ boardIds: ["b"] });
  await bound.getBestScores({ boardIds: ["b"], credentials });
  await bound.getUserData({ sections: ["dailyDash", "privateProfile"] });

  // Unbound client: public endpoints need nothing, user endpoints need credentials.
  await unbound.getServerTime();
  await unbound.getUserAvatar({ userId: "x" });
  await unbound.getUserData({ sections: ["publicProfile"], userId: "x" });
  await unbound.getBestScores({ boardIds: ["b"], credentials });
  await unbound.getPvpBadges({ credentials });

  // @ts-expect-error user endpoints of an unbound client require credentials
  await unbound.getBestScores({ boardIds: ["b"] });
  // @ts-expect-error a no-param user endpoint still needs the credentials object
  await unbound.getPvpBadges();
  // @ts-expect-error a client built with maybe-undefined credentials is unbound
  await maybe.getBestScores({ boardIds: ["b"] });
  // @ts-expect-error unknown section
  await bound.getUserData({ sections: ["nope"] });
  // @ts-expect-error dailyDash is an MX2-only section
  await new BMX2().getUserData({ sections: ["dailyDash"] });
  // @ts-expect-error endpoint methods take no type arguments
  await bound.getPvpChallenges<{ challenges: unknown[] }>({});
  // @ts-expect-error the assets client never takes credentials
  await bound.assets.getSkinsManifest({ credentials });
};

describe("type-level contracts", () => {
  test("getServerTime resolves to a number", () => {
    expectTypeOf(bound.getServerTime).returns.resolves.toBeNumber();
    expectTypeOf(unbound.getServerTime).returns.resolves.toBeNumber();
  });

  test("responses expose documented fields by dot and the rest as unknown", () => {
    // SAFETY: only the static type matters here; the value is never read at runtime.
    const response = {} as ApiResponse<{ challenges: string[] }>;

    expectTypeOf(response.challenges).toEqualTypeOf<string[]>();
    expectTypeOf(response.result).toBeString();
    expectTypeOf(response["undocumented"]).toBeUnknown();
  });

  test("the type-check block is kept alive", () => {
    expect(typeChecks).toBeInstanceOf(Function);
  });
});
