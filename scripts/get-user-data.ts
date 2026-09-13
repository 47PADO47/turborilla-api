/**
 * Example script: fetch the profile data of a user and save it to a JSON file.
 *
 * Usage:
 *   bun run scripts/get-user-data.ts <userId>
 *
 * The target userId can also come from the MADSKILLS_USER_ID env var. Public
 * sections work as a guest; set MADSKILLS_PASSWORD to also read the private
 * ones. Output is written to dist/ (git-ignored) so captured data is never
 * committed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MX2, mx2Game } from "../src/index";
import type { SectionKey } from "../src/index";

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

// SAFETY: the keys of the const section map are exactly the section names accepted for MX2.
const sections = Object.keys(mx2Game.userDataSections) as SectionKey<
  typeof mx2Game
>[];
const data = await client.getUserData({ sections, userId });

const outDir = path.join(import.meta.dir, "..", "dist");
await mkdir(outDir, { recursive: true });

const outFile = path.join(outDir, `user-data-${userId}.json`);
await writeFile(outFile, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Saved user data to ${outFile}`);
