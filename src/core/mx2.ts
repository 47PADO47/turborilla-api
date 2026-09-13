import type { AbstractConstructorOptions } from "@/types/base";

import type { getUserDataOptsMX2 } from "../types/mx2";
import Base from "./base";

class MX2 extends Base {
  constructor(options: AbstractConstructorOptions) {
    super({
      ...options,
      game: "madskillsmotocross2",
    });
  }

  override getUserDataMappings() {
    return {
      ...super.getUserDataMappings(),
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
      purchases: "Purchases",
      trackPacks: "track-packs",
    };
  }

  override async getUserData(options: getUserDataOptsMX2) {
    return await super.getUserData(options);
  }
}

export default MX2;
