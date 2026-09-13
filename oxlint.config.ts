import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";

// NOTE: The `github` JS plugin (eslint-plugin-github) is intentionally not
// loaded: it depends on typescript-eslint, which does not yet support
// TypeScript 7. Its rules are covered elsewhere (unicorn/filename-case for
// file naming, and the try/catch refactor replaced its no-then rule).
export default defineConfig({
  extends: [core, vitest, antiSlop],
  ignorePatterns: core.ignorePatterns,
});
