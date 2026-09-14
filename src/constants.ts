/** Base URL of the game backend (Google App Engine). */
export const DEFAULT_BASE_URL =
  "https://production-dot-turborillanet.appspot.com/";

/** Base URL of the assets CDN (skins, daily dash tracks, replays, translations). */
export const DEFAULT_ASSETS_BASE_URL =
  "https://dnzcutqlxlufn.cloudfront.net/dlc/";

/** Base URL of the Mad Skills Motocross 3 assets CDN. */
export const MX3_ASSETS_BASE_URL = "https://d10kyumusecfbj.cloudfront.net/dlc/";

/** Base URL of the Mad Skills BMX 2 assets CDN. This one serves from the root, without the `dlc/` prefix. */
export const BMX2_ASSETS_BASE_URL = "https://d300d4xxh5uzei.cloudfront.net/";

/** User agent sent by the iOS build the request payloads were captured from. */
export const USER_AGENT =
  "MadSkillsMX/5171 CFNetwork/3896.100.1.2.1 Darwin/27.0.0";

/** Unity engine version header sent by the game client. */
export const UNITY_VERSION = "6000.4.12f1";

/** Headers shared by every request to the backend and the CDN. */
export const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  "X-Unity-Version": UNITY_VERSION,
} as const;

/** Content type of the `json=` form body the backend expects. */
export const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";

/** Static part of the request envelope, captured from game version 2.58.5171. */
export const ENVELOPE_DEFAULTS = {
  gameVersion: "2.58.5171",
  language: "EN",
  platform: "ios",
  version: "1.0",
} as const;
