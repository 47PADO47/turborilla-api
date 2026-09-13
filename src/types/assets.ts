import type { OpenString, UnknownFields } from "./response";

/** Skin id → asset version, from `skins/skins.json`. */
export interface SkinVersions {
  [skinId: string]: number;
}

export interface SkinsManifest extends UnknownFields {
  versions: SkinVersions;
}

export interface DailyDashPrize extends UnknownFields {
  requiredPoints: number;
  type: OpenString<"Free" | "Premium">;
  /** Present on skin prizes; absent on reward-only tiers (rockets, rounds, VS minutes). */
  skinId?: string;
  name?: string;
  logo?: string;
  /** Alternative sponsor-logo key seen in a handful of older seasons. */
  logoName?: string;
  /** Free-form grouping label seen on some seasons. */
  category?: string;
  /** Reward fields are omitted (not zeroed) on tiers that do not grant them. */
  numRockets?: number;
  numPremiumRounds?: number;
  numVsMinutes?: number;
}

/** `dailydash/<YYYY>-<MM>/season.json` */
export interface DailyDashSeason extends UnknownFields {
  year: number;
  month: number;
  prizes: DailyDashPrize[];
}

/** `dailydash/<YYYY>-<MM>/dailydash-<YYYY>-<MM>-day-<D>.json` */
export interface DailyDashDay extends UnknownFields {
  filename: string;
  name: string;
  environment: string;
  laps: number;
  gravity: number;
  bike: number;
  hasSkin: boolean[];
}

/** `languages/<CODE>.json`; maps a localization key to its translated string. */
export interface Language extends UnknownFields {
  entries: Record<string, string>;
}

export interface SkinParams {
  /** E.g. `bike100193` or `rider100334`; ids are listed in the skins manifest. */
  skinId: string;
}

export interface FlagParams {
  /** ISO 3166-1 alpha-2 country code, case-insensitive (e.g. `AR` or `us`). */
  code: string;
  /**
   * Square edge length in pixels. Only `250` is currently served by the
   * backend; other buckets return 404.
   * @default 250
   */
  size?: number;
}

export interface LanguageParams {
  /** Upper-case language code, e.g. `EN`. */
  language: string;
}

export interface DailyDashMonthParams {
  year: number;
  /** 1-12 */
  month: number;
}

export interface DailyDashDayParams extends DailyDashMonthParams {
  /** 1-31 */
  day: number;
}

export interface DailyDashReplayParams extends DailyDashDayParams {
  /** Replays are numbered from 1; three were observed per day. */
  index: number;
}
