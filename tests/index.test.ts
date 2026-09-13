import { describe, expect, test } from "bun:test";

import { MX2 as SubpathMX2 } from "../src/games/mx2";
import turborilla, { Assets, BMX2, MX2, TurborillaError } from "../src/index";

describe("package entry points", () => {
  test("the default export holds one unbound client per game", () => {
    expect(turborilla.mx2).toBeInstanceOf(MX2);
    expect(turborilla.bmx2).toBeInstanceOf(BMX2);
    expect(turborilla.mx2.authenticated).toBe(false);
    expect(turborilla.mx2.assets).toBeInstanceOf(Assets);
  });

  test("named and subpath exports resolve to the same classes", () => {
    expect(SubpathMX2).toBe(MX2);
    expect(new TurborillaError("x", { code: "API_ERROR" })).toBeInstanceOf(
      Error
    );
  });
});
