/**
 * Example script: fetch the profile data of a user and save it as explorable JSON.
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

const userId = process.argv[2] ?? process.env["MADSKILLS_USER_ID"];
if (!userId) {
  throw new Error(
    "Missing userId. Usage: bun run scripts/get-user-data.ts <userId>"
  );
}

const password = process.env["MADSKILLS_PASSWORD"];
const client = new MX2({
  credentials: password ? { password, userId } : { userId },
});

const response = await client.getUserData({
  sections: [
    "achievementSystem",
    "dailyDash",
    "jamDivision",
    "payments",
    "privateProfile",
    "publicProfile",
    "purchases",
    "trackPacks",
  ],
});

// Each section in response.data is a JSON-encoded string; parse them into
// objects so the saved file is explorable. Values that are not JSON strings
// are kept as-is.
const sections = response["data"];
const parsed = Object.fromEntries(
  Object.entries(sections instanceof Object ? sections : {}).map(
    ([key, value]) => {
      if (value instanceof Object) {
        return [key, value];
      }
      try {
        return [key, JSON.parse(String(value).replace(STRAY_QUOTE, ","))];
      } catch {
        console.log(`Failed to parse ${key}`);
        return [key, value];
      }
    }
  )
);

const outDir = path.join(import.meta.dir, "..", ".captures", userId);
await mkdir(outDir, { recursive: true });

const outFile = path.join(outDir, "user-data.json");
await writeFile(outFile, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(`Saved user data to ${outFile}`);
