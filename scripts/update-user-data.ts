/**
 * Example script: update the profile sections of a user.
 *
 * Reads a decoded profile file (as produced by get-user-data.ts) from
 *   .captures/<game>/<userId>/user-data.json
 * re-encodes every section back to a JSON string, and pushes it via
 * setUserData.
 *
 * Usage:
 *   bun run scripts/update-user-data.ts <game> <userId>
 *
 * <game> is one of mx2 | mx3 | bmx2 (or MADSKILLS_GAME); the userId can also
 * come from MADSKILLS_USER_ID. MADSKILLS_PASSWORD is required since writing
 * profile data is authenticated.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { BMX2, MX2, MX3 } from "../src/index";
import type { UserDataSections, UserDataVisibility } from "../src/index";

// Sections that should be publicly visible. Edit this set to control the
// per-section `isPublic` flag; any section not listed is uploaded as private.
const PUBLIC_SECTIONS = new Set<string>(["public-profile"]);

const USAGE =
  "Usage: bun run scripts/update-user-data.ts <mx2|mx3|bmx2> <userId>";

const game = process.argv[2] ?? process.env["MADSKILLS_GAME"] ?? "";
const userId = process.argv[3] ?? process.env["MADSKILLS_USER_ID"];
if (!userId) {
  throw new Error(`Missing userId. ${USAGE}`);
}

const password = process.env["MADSKILLS_PASSWORD"];
if (!password) {
  throw new Error(
    "MADSKILLS_PASSWORD is required: setUserData is an authenticated endpoint"
  );
}

const credentials = { password, userId };
const client = ((): BMX2 | MX2 | MX3 => {
  switch (game) {
    case "bmx2": {
      return new BMX2({ credentials });
    }
    case "mx3": {
      return new MX3({ credentials });
    }
    case "mx2": {
      return new MX2({ credentials });
    }
    default: {
      throw new Error(USAGE);
    }
  }
})();

const inFile = path.join(
  import.meta.dir,
  "..",
  ".captures",
  userId,
  game,
  "user-data.json"
);
// The capture holds the whole getUserData response; the sections live under
// its `data` key.
const capture: { data?: object } = JSON.parse(readFileSync(inFile, "utf-8"));
const profile = capture.data ?? {};

// Encode every section in the file back into a JSON string.
const data: UserDataSections = {};
const isPublic: UserDataVisibility = {};
for (const [section, value] of Object.entries(profile)) {
  data[section] = JSON.stringify(value);
  isPublic[section] = PUBLIC_SECTIONS.has(section);
}

const response = await client.setUserData({ data, isPublic });
console.log(
  `Updated ${Object.keys(data).length} section(s): ${response.result}`
);
