import { TurborillaClient } from "../client";
import type { ClientOptions } from "../client";
import { MX3_ASSETS_BASE_URL } from "../constants";
import type { Credentials } from "../types/credentials";
import { baseUserDataSections } from "./definition";
import type { GameDefinition } from "./definition";

/**
 * Mad Skills Motocross 3.
 *
 * The backend id follows the `madskillsmotocross2` pattern; it and the
 * game-specific `getUserData` sections are unverified against captured
 * traffic and can be extended once available. The assets CDN differs from
 * MX2/BMX2 and is set here.
 */
export const mx3Game = {
  assetsBaseUrl: MX3_ASSETS_BASE_URL,
  id: "madskillsmotocross3",
  userDataSections: baseUserDataSections,
} as const satisfies GameDefinition;

export type Mx3Game = typeof mx3Game;

/** Client for Mad Skills Motocross 3 (`madskillsmotocross3`). */
export class MX3<
  TCredentials extends Credentials | undefined = undefined,
> extends TurborillaClient<Mx3Game, TCredentials> {
  constructor(options?: ClientOptions<TCredentials>) {
    super(mx3Game, options);
  }
}
