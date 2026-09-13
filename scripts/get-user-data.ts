/**
 * Example script: fetch a user's profile data and save it as explorable JSON.
 *
 * Usage:
 *   bun run scripts/get-user-data.ts <userId>
 *
 * The target userId can also come from the MADSKILLS_USER_ID env var, and an
 * optional password from MADSKILLS_PASSWORD (needed for private sections).
 * Output is written to dist/ (git-ignored) so captured data is never committed.
 *
 * While iterating on the parsing the live fetch is commented out and the script
 * reads the previously-saved response from dist/ instead, so we don't spam the
 * API. Re-enable the MX2 block below to refresh the cached response.
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
// import { MX2 } from "../src/index";

// The API occasionally emits a stray apostrophe after a value (e.g. `true,'`);
// drop any single quote that sits between a comma and a line break.
const STRAY_QUOTE = /,'(?=\s*[\r\n])/gu;

const userId = process.argv[2] ?? process.env.MADSKILLS_USER_ID;
if (!userId) {
  throw new Error(
    "Missing userId. Usage: bun run scripts/get-user-data.ts <userId>"
  );
}

const outDir = path.join(import.meta.dir, "..", "dist");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, `user-data-${userId}.json`);

// --- Live fetch (commented out while iterating so we don't spam the API) ---
// const client = new MX2({
//   debug: true,
//   password: process.env.MADSKILLS_PASSWORD,
//   userId,
// });
// const response = await client.getUserData({
//   achievementSystem: true,
//   dailyDash: true,
//   divisionEndurance: true,
//   divisionExpert: true,
//   divisionIntermediate: true,
//   divisionMaster: true,
//   divisionNovice: true,
//   divisionPro: true,
//   divisionStarman: true,
//   divisionTopjam: true,
//   divisionTopjam2: true,
//   divisionWc16: true,
//   divisionWc18: true,
//   divisionWc19: true,
//   jamDivision: true,
//   payments: true,
//   privateProfile: true,
//   publicProfile: true,
//   purchases: true,
//   trackPacks: true,
// });
const response = JSON.parse(readFileSync(outFile, "utf-8"));

// Each section in response.data is a JSON-encoded string; parse them into
// objects so the saved file is explorable. Values that aren't JSON strings
// (or already-parsed cache entries) are kept as-is.
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

await writeFile(
  outFile,
  `${JSON.stringify({ ...response, data: parsed }, null, 2)}\n`
);

console.log(`Saved user data to ${outFile}`);
