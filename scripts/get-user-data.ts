/**
 * Example script: fetch the profile data of a user and save it as explorable JSON.
 *
 * Usage:
 *   bun run scripts/get-user-data.ts <game> <userId>
 *
 * <game> is one of mx2 | mx3 | bmx2 (or MADSKILLS_GAME). The target userId can
 * also come from MADSKILLS_USER_ID, and an optional password from
 * MADSKILLS_PASSWORD (needed for private sections when reading yourself).
 * Output is written to .captures/<game>/<userId>/user-data.json (git-ignored)
 * so captured data is never committed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { BMX2, MX2, MX3 } from "../src/index";

// The API occasionally emits a stray apostrophe after a value (e.g. `true,'`);
// drop any single quote that sits between a comma and a line break.
const STRAY_QUOTE = /,'(?=\s*[\r\n])/gu;

const USAGE = "Usage: bun run scripts/get-user-data.ts <mx2|mx3|bmx2> <userId>";

const game = process.argv[2] ?? process.env["MADSKILLS_GAME"] ?? "";
const userId = process.argv[3] ?? process.env["MADSKILLS_USER_ID"];
if (!userId) {
  throw new Error(`Missing userId. ${USAGE}`);
}

const password = process.env["MADSKILLS_PASSWORD"];
const credentials = password ? { password, userId } : { userId };

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

// Request every section this game knows about, by its raw wire name.
const keys = Object.values(client.game.userDataSections);
const response = await client.getUserData({ keys, sections: [] });

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

const outDir = path.join(import.meta.dir, "..", ".captures", game, userId);
await mkdir(outDir, { recursive: true });

const outFile = path.join(outDir, "user-data.json");
await writeFile(outFile, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(`Saved user data to ${outFile}`);
