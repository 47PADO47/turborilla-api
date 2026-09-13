/**
 * Example script: fetch the daily dash season and the track of the day from the
 * assets CDN and save them under dist/.
 *
 * Usage:
 *   bun run scripts/get-daily-dash.ts [year] [month] [day]
 *
 * Defaults to today (UTC). Output is written to dist/ (git-ignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Assets } from "../src/assets";

const today = new Date();
const [year, month, day] = [
  Number(process.argv[2] ?? today.getUTCFullYear()),
  Number(process.argv[3] ?? today.getUTCMonth() + 1),
  Number(process.argv[4] ?? today.getUTCDate()),
];

const assets = new Assets();
const season = await assets.getDailyDashSeason({ month, year });
const track = await assets.getDailyDashDay({ day, month, year });

const outDir = path.join(import.meta.dir, "..", "dist");
await mkdir(outDir, { recursive: true });

const stem = `daily-dash-${year}-${month}-${day}`;
await writeFile(
  path.join(outDir, `${stem}-season.json`),
  `${JSON.stringify(season, null, 2)}\n`
);
await writeFile(
  path.join(outDir, `${stem}.json`),
  `${JSON.stringify(track, null, 2)}\n`
);

console.log(
  `Saved ${track.name} (${track.environment}) to ${outDir}/${stem}*.json`
);
