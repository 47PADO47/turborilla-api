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
import type {
  SetUserDataParams,
  UserDataSections,
  UserDataVisibility,
} from "../src/index";

// Sections that should be publicly visible. Edit this set to control the
// per-section `isPublic` flag; any section not listed is uploaded as private.
const PUBLIC_SECTIONS = new Set<string>(["public-profile"]);

// Session metadata sent with every upload. gameVersionNumber is a 64-bit
// counter that exceeds Number.MAX_SAFE_INTEGER, so it cannot round-trip
// losslessly as a JS number; the game accepts the nearest value.
// oxlint-disable-next-line no-loss-of-precision -- captured game-version counter, sent as-is
const GAME_VERSION_NUMBER = 9_042_443_756_376_873;

// getUserData never returns newRealMoneyPurchases, but setUserData requires it.
// Supply this stub only when the wallet reports no real-money purchases. The
// install id is device-specific; set MADSKILLS_INSTALL_ID in your .env.
const NEW_REAL_MONEY_PURCHASES = {
  installId: process.env["MADSKILLS_INSTALL_ID"] ?? "",
  sendCount: 0,
};

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
// The capture holds the whole getUserData response: the sections live under
// `data`, and the wallet and owner id travel back with the upload.
interface CapturedData {
  "public-profile"?: { "profile level"?: number };
}
interface CapturedWallet {
  virtualGoods?: { totalRealMoneyPurchases?: number };
}
const capture: {
  data?: CapturedData;
  wallet?: CapturedWallet;
  userDataOwnerId?: string;
} = JSON.parse(readFileSync(inFile, "utf-8"));
const profile: CapturedData = capture.data ?? {};

// Encode every section in the file back into a JSON string.
const data: UserDataSections = {};
const isPublic: UserDataVisibility = {};
for (const [section, value] of Object.entries(profile)) {
  data[section] = JSON.stringify(value);
  isPublic[section] = PUBLIC_SECTIONS.has(section);
}

const params: SetUserDataParams = {
  data,
  gameVersionNumber: GAME_VERSION_NUMBER,
  isPublic,
};
// The account level is the public profile's "profile level" field.
const profileLevel = profile["public-profile"]?.["profile level"];
if (profileLevel !== undefined) {
  params.level = profileLevel;
}
// Re-encode the wallet's virtualGoods back into a JSON string before upload,
// and supply a newRealMoneyPurchases stub when there are no real purchases
// (getUserData omits it, but setUserData rejects a null one).
if (capture.wallet !== undefined) {
  const entries = Object.entries(capture.wallet).map(([key, value]) =>
    key === "virtualGoods" && value instanceof Object
      ? [key, JSON.stringify(value)]
      : [key, value]
  );
  if (capture.wallet.virtualGoods?.totalRealMoneyPurchases === 0) {
    entries.push(["newRealMoneyPurchases", NEW_REAL_MONEY_PURCHASES]);
  }
  params.wallet = Object.fromEntries(entries);
}
if (capture.userDataOwnerId !== undefined) {
  params.ownerId = capture.userDataOwnerId;
}

const response = await client.setUserData(params);
console.log(
  `Updated ${Object.keys(data).length} section(s): ${response.result}`
);
