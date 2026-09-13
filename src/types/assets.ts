import type { OpenString, UnknownFields } from "./response";

/** Skin id → asset version, from `skins/skins.json`. */
export interface SkinVersions {
  [skinId: string]: number;
}

export interface SkinsManifest extends UnknownFields {
  versions: SkinVersions;
}

export interface DailyDashPrize extends UnknownFields {
  name?: string;
  logo?: string;
  skinId?: string;
  requiredPoints: number;
  numRockets: number;
  numPremiumRounds: number;
  numVsMinutes: number;
  type: OpenString<"Free" | "Premium">;
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

export interface SkinParams {
  /** E.g. `bike100193` or `rider100334`; ids are listed in the skins manifest. */
  skinId: string;
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
