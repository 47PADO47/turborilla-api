import { TurborillaClient } from "../client";
import type { ClientOptions } from "../client";
import { BMX2_ASSETS_BASE_URL } from "../constants";
import type { CallArgs, Credentials } from "../types/credentials";
import type { GameConfig } from "../types/endpoints";
import type { ApiResponse, EmptyObject } from "../types/response";
import { baseUserDataSections } from "./definition";
import type { GameDefinition } from "./definition";

/** Mad Skills BMX 2. */
export const bmx2Game = {
  assetsBaseUrl: BMX2_ASSETS_BASE_URL,
  envelope: { includeUserDataSession: true },
  id: "bmx2",
  userDataSections: baseUserDataSections,
} as const satisfies GameDefinition;

export type Bmx2Game = typeof bmx2Game;

/** Client for Mad Skills BMX 2 (`bmx2`). */
export class BMX2<
  TCredentials extends Credentials | undefined = undefined,
> extends TurborillaClient<Bmx2Game, TCredentials> {
  constructor(options?: ClientOptions<TCredentials>) {
    super(bmx2Game, options);
  }

  /** Remote game config. A plain GET: no envelope is sent. */
  getGameConfig(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<ApiResponse<GameConfig>> {
    const { credentials, signal } = this.resolve<EmptyObject>(args, "public");
    return this.request<GameConfig>({
      credentials,
      method: "GET",
      path: "app/madskillsmx2/config.json",
      signal,
    });
  }
}
