/**
 * Local helper: deeply sort selected sections of a captured profile file using
 * natural (numeric-aware) ordering, in place.
 *
 * This operates only on the local capture at
 *   .captures/<game>/<userId>/user-data.json
 * and does NOT call the API.
 *
 * Usage:
 *   bun run scripts/sort-user-data.ts <game> <userId>
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { JsonObject, JsonValue } from "../src/index";

// Sections whose fields should be sorted.
const SORTED_SECTIONS = ["achievement system", "private-profile"];

// Natural, case-insensitive comparison so e.g. bike1 < bike2 < bike10.
const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Recursively sort object keys. Arrays keep their order; primitives pass through.
const deepSortKeys = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys);
  }
  if (value instanceof Object) {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([a], [b]) => naturalCompare(a, b))
        .map(([key, entry]) => [key, deepSortKeys(entry)])
    );
  }
  return value;
};

const GAME_KEYS: string[] = ["mx2", "mx3", "bmx2"];
const USAGE =
  "Usage: bun run scripts/sort-user-data.ts <mx2|mx3|bmx2> <userId>";

const game = process.argv[2] ?? process.env["MADSKILLS_GAME"] ?? "";
if (!GAME_KEYS.includes(game)) {
  throw new Error(USAGE);
}

const userId = process.argv[3] ?? process.env["MADSKILLS_USER_ID"];
if (!userId) {
  throw new Error(`Missing userId. ${USAGE}`);
}

const file = path.join(
  import.meta.dir,
  "..",
  ".captures",
  game,
  userId,
  "user-data.json"
);
const profile: JsonObject = JSON.parse(readFileSync(file, "utf-8"));

for (const section of SORTED_SECTIONS) {
  if (section in profile) {
    profile[section] = deepSortKeys(profile[section]);
  }
}

writeFileSync(file, `${JSON.stringify(profile, null, 2)}\n`);
console.log(`Sorted [${SORTED_SECTIONS.join(", ")}] in ${file}`);
