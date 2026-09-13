/**
 * Example script: fetch a user's profile data and save it to a JSON file.
 *
 * Usage:
 *   bun run scripts/get-user-data.ts <userId>
 *
 * The target userId can also come from the MADSKILLS_USER_ID env var, and an
 * optional password from MADSKILLS_PASSWORD (needed for private sections).
 * Output is written to dist/ (git-ignored) so captured data is never committed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MX2 } from "../src/index";

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

const outDir = path.join(import.meta.dir, "..", "dist");
await mkdir(outDir, { recursive: true });

// Each section in response.data is a JSON-encoded string; parse them into
// objects so the saved file is explorable. Non-JSON values are kept as-is.
const sections = response.data ?? {};
const parsed = Object.fromEntries(
  Object.entries(sections).map(([key, value]) => {
    try {
      return [key, JSON.parse(value)];
    } catch {
      // Not a JSON string (e.g. a plain value) — keep it as-is.
      return [key, value];
    }
  })
);

const outFile = path.join(outDir, `user-data-${userId}.json`);
await writeFile(
  outFile,
  `${JSON.stringify({ ...response, data: parsed }, null, 2)}\n`
);

console.log(`Saved user data to ${outFile}`);
