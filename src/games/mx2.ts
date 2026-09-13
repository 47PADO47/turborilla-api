import { TurborillaClient } from "../client";
import type { ClientOptions } from "../client";
import type { Credentials } from "../types/credentials";
import { baseUserDataSections } from "./definition";
import type { GameDefinition } from "./definition";

/** Mad Skills Motocross 2. */
export const mx2Game = {
  id: "madskillsmotocross2",
  userDataSections: {
    ...baseUserDataSections,
    dailyDash: "dailydash",
    divisionEndurance: "division_endurance",
    divisionExpert: "division_expert",
    divisionIntermediate: "division_intermediate",
    divisionMaster: "division_master",
    divisionNovice: "division_novice",
    divisionPro: "division_pro",
    divisionStarman: "division_starman",
    divisionTopjam: "division_topjam",
    divisionTopjam2: "division_topjam2",
    divisionWc16: "division_wc16",
    divisionWc18: "division_wc18",
    divisionWc19: "division_wc19",
    jamDivision: "jam division",
    trackPacks: "track-packs",
  },
} as const satisfies GameDefinition;

export type Mx2Game = typeof mx2Game;

/** Client for Mad Skills Motocross 2 (`madskillsmotocross2`). */
export class MX2<
  TCredentials extends Credentials | undefined = undefined,
> extends TurborillaClient<Mx2Game, TCredentials> {
  constructor(options?: ClientOptions<TCredentials>) {
    super(mx2Game, options);
  }
}
