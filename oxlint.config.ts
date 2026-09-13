import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

// NOTE: Two ultracite presets are intentionally not loaded:
// - The `github` JS plugin (eslint-plugin-github) depends on typescript-eslint,
//   which does not yet support TypeScript 7. Its rules are covered elsewhere
//   (unicorn/filename-case for file naming, try/catch replaced its no-then).
// - The `vitest` preset is omitted because this project uses bun's test runner
//   (`bun:test`), not vitest; its globals and auto-imports conflict with it.
export default defineConfig({
  extends: [core, antiSlop],
  ignorePatterns: core.ignorePatterns,
});
