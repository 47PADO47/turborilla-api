/**
 * Example script: update a user's profile sections.
 *
 * Reads a decoded profile file (as produced by get-user-data.ts) from
 *   .captures/user-data-<userId>.json
 * re-encodes every section back to a JSON string, and pushes it via
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

// Sections that should be publicly visible. Edit this set to control the
// per-section `isPublic` flag; any section not listed is uploaded as private.
const PUBLIC_SECTIONS = new Set<string>(["public-profile"]);

const userId = process.argv[2] ?? process.env.MADSKILLS_USER_ID;
if (!userId) {
  throw new Error(
    "Missing userId. Usage: bun run scripts/update-user-data.ts <userId>"
  );
}

const inFile = path.join(
  import.meta.dir,
  "..",
  ".captures",
  `user-data-${userId}.json`
);
const profile = JSON.parse(readFileSync(inFile, "utf-8"));

// Encode every section in the file back into a JSON string.
const data: Record<string, string> = {};
const isPublic: Record<string, boolean> = {};
for (const [section, value] of Object.entries(profile)) {
  data[section] = JSON.stringify(value);
  isPublic[section] = PUBLIC_SECTIONS.has(section);
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
