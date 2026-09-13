/**
 * Example script: update a user's writable profile sections.
 *
 * Reads a decoded profile file (as produced by get-user-data.ts) from
 *   dist/user-data-<userId>.json
 * re-encodes each writable section back to a JSON string, and sends it via
 * setUserData.
 *
 * Usage:
 *   bun run scripts/update-user-data.ts <userId>
 *
 * The userId can also come from MADSKILLS_USER_ID; MADSKILLS_PASSWORD is
 * required since writing profile data is authenticated.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { MX2 } from "../src/index";

// Sections that setUserData accepts, mapped to whether they are public.
const WRITABLE_SECTIONS = {
  Purchases: false,
  dailydash: false,
  "private-profile": false,
  "public-profile": true,
} satisfies Record<string, boolean>;

const userId = process.argv[2] ?? process.env.MADSKILLS_USER_ID;
if (!userId) {
  throw new Error(
    "Missing userId. Usage: bun run scripts/update-user-data.ts <userId>"
  );
}

const inFile = path.join(
  import.meta.dir,
  "..",
  "dist",
  `user-data-${userId}.json`
);
const profile = JSON.parse(readFileSync(inFile, "utf-8"));

// Encode each writable section present in the file back into a JSON string.
const data: Record<string, string> = {};
const isPublic: Record<string, boolean> = {};
for (const [section, isSectionPublic] of Object.entries(WRITABLE_SECTIONS)) {
  const value = profile[section];
  if (value === undefined) {
    continue;
  }
  data[section] = JSON.stringify(value);
  isPublic[section] = isSectionPublic;
}

const client = new MX2({
  debug: true,
  password: process.env.MADSKILLS_PASSWORD,
  userId,
});

const response = await client.setUserData({ data, isPublic });
console.log(
  `Updated ${Object.keys(data).length} section(s): ${response.result}`
);
