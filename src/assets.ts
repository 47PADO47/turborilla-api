import type { Logger } from "@padosoft/logger";

import { DEFAULT_ASSETS_BASE_URL, DEFAULT_HEADERS } from "./constants";
import { TurborillaError } from "./errors";
import type {
  DailyDashDay,
  DailyDashDayParams,
  DailyDashMonthParams,
  DailyDashReplayParams,
  DailyDashSeason,
  Language,
  LanguageParams,
  SkinParams,
  SkinsManifest,
} from "./types/assets";
import type { RequestOptions } from "./types/credentials";

/** Anything shaped like the global `fetch`; the global itself qualifies. */
export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export interface AssetsOptions {
  /** Defaults to the production CDN. */
  baseUrl?: string | undefined;
  /** Defaults to the global `fetch`, resolved at call time. */
  fetch?: FetchLike | undefined;
  headers?: Record<string, string> | undefined;
  logger?: Logger | undefined;
}

const MONTH_DIGITS = 2;

const padMonth = (month: number): string =>
  String(month).padStart(MONTH_DIGITS, "0");

/** `dailydash/2026-09` */
export const dailyDashMonthPath = ({
  month,
  year,
}: DailyDashMonthParams): string => `dailydash/${year}-${padMonth(month)}`;

/**
 * `dailydash/2026-09/dailydash-2026-09-day-13` (no extension). Days were only
 * captured unpadded (`day-13`); single-digit days are assumed to follow suit.
 */
export const dailyDashPath = ({
  day,
  month,
  year,
}: DailyDashDayParams): string =>
  `${dailyDashMonthPath({ month, year })}/dailydash-${year}-${padMonth(month)}-day-${day}`;

/** Client for the public assets CDN. No endpoint here needs credentials. */
export class Assets {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike | undefined;
  private readonly headers: Record<string, string>;
  private readonly logger: Logger | undefined;

  constructor(options: AssetsOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_ASSETS_BASE_URL;
    this.fetchImpl = options.fetch;
    this.headers = { ...DEFAULT_HEADERS, ...options.headers };
    this.logger = options.logger;
  }

  // --- URL builders ---

  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  skinsManifestUrl(): string {
    return this.url("skins/skins.json");
  }

  skinUrl({ skinId }: SkinParams): string {
    return this.url(`skins/${skinId}.zip`);
  }

  languageUrl({ language }: LanguageParams): string {
    return this.url(`languages/${language}.json`);
  }

  dailyDashSeasonUrl(params: DailyDashMonthParams): string {
    return this.url(`${dailyDashMonthPath(params)}/season.json`);
  }

  dailyDashDayUrl(params: DailyDashDayParams): string {
    return this.url(`${dailyDashPath(params)}.json`);
  }

  dailyDashTrackUrl(params: DailyDashDayParams): string {
    return this.url(`${dailyDashPath(params)}.trk`);
  }

  dailyDashReplayUrl({ index, ...day }: DailyDashReplayParams): string {
    return this.url(`${dailyDashPath(day)}-${index}.replay`);
  }

  // --- Downloads ---

  getSkinsManifest(options: RequestOptions = {}): Promise<SkinsManifest> {
    return this.getJson<SkinsManifest>(this.skinsManifestUrl(), options.signal);
  }

  downloadSkin({
    signal,
    ...params
  }: SkinParams & RequestOptions): Promise<ArrayBuffer> {
    return this.getBinary(this.skinUrl(params), signal);
  }

  getLanguage({
    signal,
    ...params
  }: LanguageParams & RequestOptions): Promise<Language> {
    return this.getJson<Language>(this.languageUrl(params), signal);
  }

  getDailyDashSeason({
    signal,
    ...params
  }: DailyDashMonthParams & RequestOptions): Promise<DailyDashSeason> {
    return this.getJson<DailyDashSeason>(
      this.dailyDashSeasonUrl(params),
      signal
    );
  }

  getDailyDashDay({
    signal,
    ...params
  }: DailyDashDayParams & RequestOptions): Promise<DailyDashDay> {
    return this.getJson<DailyDashDay>(this.dailyDashDayUrl(params), signal);
  }

  downloadDailyDashTrack({
    signal,
    ...params
  }: DailyDashDayParams & RequestOptions): Promise<ArrayBuffer> {
    return this.getBinary(this.dailyDashTrackUrl(params), signal);
  }

  downloadDailyDashReplay({
    signal,
    ...params
  }: DailyDashReplayParams & RequestOptions): Promise<ArrayBuffer> {
    return this.getBinary(this.dailyDashReplayUrl(params), signal);
  }

  // --- Transport ---

  private async get(
    url: string,
    signal: AbortSignal | undefined
  ): Promise<Response> {
    this.logger?.debug(`[turborilla] assets GET ${url}`);

    const init: RequestInit = { headers: this.headers, method: "GET" };
    if (signal) {
      init.signal = signal;
    }

    const fetchImpl = this.fetchImpl ?? globalThis.fetch;
    const response = await fetchImpl(url, init);

    if (!response.ok) {
      const error = new TurborillaError(
        `Asset request failed: ${url} (${response.status} ${response.statusText})`,
        { code: "HTTP_ERROR", status: response.status, url }
      );
      this.logger?.error(error.message);
      throw error;
    }

    return response;
  }

  private async getJson<TData extends object>(
    url: string,
    signal: AbortSignal | undefined
  ): Promise<TData> {
    const response = await this.get(url, signal);
    try {
      // SAFETY: CDN manifests are static JSON documents whose shapes are documented in `types/assets.ts`.
      return (await response.json()) as TData;
    } catch (error) {
      throw new TurborillaError(`Could not parse JSON from ${url}`, {
        cause: error,
        code: "INVALID_JSON",
        status: response.status,
        url,
      });
    }
  }

  private async getBinary(
    url: string,
    signal: AbortSignal | undefined
  ): Promise<ArrayBuffer> {
    const response = await this.get(url, signal);
    return await response.arrayBuffer();
  }
}
