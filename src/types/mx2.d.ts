import type { getUserDataOpts } from "./base";

export interface getUserDataOptsMX2 extends getUserDataOpts {
  dailyDash?: boolean;
  trackPacks?: boolean;
  purchases?: boolean;
  jamDivision?: boolean;
  divisionNovice?: boolean;
  divisionIntermediate?: boolean;
  divisionExpert?: boolean;
  divisionMaster?: boolean;
  divisionPro?: boolean;
  divisionTopjam?: boolean;
  divisionStarman?: boolean;
  divisionEndurance?: boolean;
  divisionWc16?: boolean;
  divisionWc18?: boolean;
  divisionWc19?: boolean;
  divisionTopjam2?: boolean;
}
