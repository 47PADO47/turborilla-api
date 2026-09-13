import type { JsonObject } from "../types/response";

/** Static description of a Turborilla game backend. Adding a game means adding one of these. */
export interface GameDefinition {
  /** Backend game id, sent as `${id}-release` in the envelope. */
  readonly id: string;
  /**
   * Assets CDN base URL for this game. Defaults to `DEFAULT_ASSETS_BASE_URL`
   * when omitted; a per-call `assetsBaseUrl` option still overrides it.
   */
  readonly assetsBaseUrl?: string;
  /** Extra envelope fields the client of this game always sends. */
  readonly envelope?: Readonly<JsonObject>;
  /** Maps friendly `getUserData` section names to the backend storage keys. */
  readonly userDataSections: Readonly<Record<string, string>>;
}

/** `getUserData` sections shared by every game. */
export const baseUserDataSections = {
  achievementSystem: "achievement system",
  payments: "payments",
  privateProfile: "private-profile",
  publicProfile: "public-profile",
  purchases: "Purchases",
} as const;

/** The section names accepted by `getUserData` for a given game. */
export type SectionKey<TGame extends GameDefinition> =
  keyof TGame["userDataSections"] & string;
