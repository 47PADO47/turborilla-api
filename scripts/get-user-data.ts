/**
 * Example script: fetch a user's profile data and save it as explorable JSON.
 *
 * Usage:
 *   bun run scripts/get-user-data.ts <userId>
 *
 * The target userId can also come from the MADSKILLS_USER_ID env var, and an
 * optional password from MADSKILLS_PASSWORD (needed for private sections).
 * Output is written to .captures/<userId>/user-data.json (git-ignored) so
 * captured data is never committed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MX2 } from "../src/index";

// The API occasionally emits a stray apostrophe after a value (e.g. `true,'`);
// drop any single quote that sits between a comma and a line break.
const STRAY_QUOTE = /,'(?=\s*[\r\n])/gu;

// Recursively sort object keys alphabetically. Arrays keep their order;
// primitives are returned untouched.
const deepSortKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys);
  }
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.keys(value)
        .toSorted((a, b) => a.localeCompare(b))
        .map((key) => [key, deepSortKeys(value[key])])
    );
  }
  return value;
};

const userId = process.argv[2] ?? process.env.MADSKILLS_USER_ID;
if (!userId) {
  throw new Error(
    "Missing userId. Usage: bun run scripts/get-user-data.ts <userId>"
  );
}

const client = new MX2({
  debug: true,
  password: process.env.MADSKILLS_PASSWORD,
  userId,
});

const response = await client.getUserData({
  achievementSystem: true,
  dailyDash: true,
  divisionEndurance: true,
  divisionExpert: true,
  divisionIntermediate: true,
  divisionMaster: true,
  divisionNovice: true,
  divisionPro: true,
  divisionStarman: true,
  divisionTopjam: true,
  divisionTopjam2: true,
  divisionWc16: true,
  divisionWc18: true,
  divisionWc19: true,
  jamDivision: true,
  payments: true,
  privateProfile: true,
  publicProfile: true,
  purchases: true,
  trackPacks: true,
});

// Each section in response.data is a JSON-encoded string; parse them into
// objects so the saved file is explorable. Values that aren't JSON strings are
// kept as-is.
const sections = response.data ?? {};
const parsed = Object.fromEntries(
  Object.entries(sections).map(([key, value]) => {
    if (value instanceof Object) {
      return [key, value];
    }
    try {
      return [key, JSON.parse(String(value).replace(STRAY_QUOTE, ","))];
    } catch {
      console.log(`Failed to parse ${key}`);
      return [key, value];
    }
  })
);

// Sort the achievement system section's fields alphabetically (deeply) so the
// saved file is easy to scan and diff.
if ("achievement system" in parsed) {
  parsed["achievement system"] = deepSortKeys(parsed["achievement system"]);
}

const outDir = path.join(import.meta.dir, "..", ".captures", userId);
await mkdir(outDir, { recursive: true });

const outFile = path.join(outDir, "user-data.json");
await writeFile(outFile, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(`Saved user data to ${outFile}`);
