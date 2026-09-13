import type { GameDefinition, SectionKey } from "../games/definition";
import type { JsonObject } from "./response";

// Request payloads were modelled from captured production traffic. Shared
// shapes are named after their single field; endpoint-specific ones after the
// endpoint.

// --- Shared ---

export interface UserIdParams {
  userId: string;
}

export interface UserIdsParams {
  userIds: readonly string[];
}

export interface BoardIdParams {
  boardId: string;
}

export interface ChallengeIdParams {
  challengeId: string;
}

// --- Users & social ---

export interface IsUsernameAvailableParams {
  username: string;
  /** Defaults to `true`. */
  suggestAlternatives?: boolean;
}

export interface GetUserByUsernameParams {
  username: string;
}

/** The backend accepts either a `username` or a `userId`. */
export type GetUserParams = GetUserByUsernameParams | UserIdParams;

export interface GetUserDataParams<TGame extends GameDefinition> {
  /** Friendly section names, mapped to backend keys through the game definition. */
  sections: readonly SectionKey<TGame>[];
  /** Raw backend keys for sections this wrapper does not know about. */
  keys?: readonly string[];
  /** Read another user instead of the caller (public sections only). */
  userId?: string;
}

export interface SetUserDataParams {
  data: JsonObject;
  isPublic?: JsonObject;
}

// --- Leaderboards & scores ---

export interface GetRankFromScoreParams {
  boardIds: readonly string[];
  scores?: readonly number[] | null;
  preciseRankLimit?: number;
  lightweight?: boolean;
}

export interface GetBestScoresParams {
  boardIds: readonly string[];
}

export interface GetBetterHighscoreParams extends BoardIdParams {
  /** Defaults to `null`. */
  referenceScore?: number | null;
}

export interface GetHighscoreBlobParams extends BoardIdParams, UserIdParams {}

export interface SetHighscoreParams {
  boardId: readonly string[];
  boardName: readonly string[];
  rankBoards: boolean;
  rankedBoards: readonly boolean[];
  score: number;
  properties: JsonObject;
  uploaded: boolean;
  UUID: string;
  blobless: boolean;
  createdInGameVersion: string;
}

export interface GetLeaderboardPageParams extends BoardIdParams {
  pageSize: number;
  cursor?: string | null;
}

// --- Levels & jam ---

export interface DownloadLevelParams {
  /** E.g. `gamemadskillsmotocross2-release|nameBlot_out_the_Sun`. */
  levelId: string;
}

export interface GetJamRoundParams {
  roundId: string;
}

export interface UpdateJamRoundStatsParams {
  roundId: string;
  attemptsSinceLastUpdate: readonly number[];
  defeatedPlayersSinceLastUpdate: number;
}

// --- Notifications ---

export interface SetNotificationSettingsParams {
  addDeviceToken?: string;
  removeDeviceToken?: string | null;
  settings?: JsonObject | null;
  isFirebaseSandbox?: boolean;
}

export interface SetNotificationFrequencyParams {
  frequency: string;
}

// --- PvP ---

export interface GetPvpChallengesParams {
  status?: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface SetPvpChallengeUserSettingsParams {
  isTauntEnabled: boolean;
}

export interface ClaimPvpRewardParams {
  rewardId: string;
}

export interface ContinuePvpChallengeParams {
  previousChallengeId: string;
  level: string;
  timeStart: number;
}

export interface FinishPvpChallengeParams extends ChallengeIdParams {
  pairingNumber: number;
  secondaryPairingNumber: number;
}

export interface UpdatePvpChallengeParams extends ChallengeIdParams {
  secondaryScore: number;
  timeUsed: number;
  timeAdded: number;
  checksum: number;
  score: number;
}

// --- Documented responses ---

/** `app/madskillsmx2/config.json` */
export interface GameConfig {
  enabled: boolean;
  resources: JsonObject;
}
