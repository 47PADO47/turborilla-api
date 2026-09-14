import type { GameDefinition, SectionKey } from "../games/definition";
import type { JsonObject, UnknownFields } from "./response";

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

/** The documented fields returned by `getUser`. */
export interface GetUserResponse {
  userId: string;
  username: string;
  /** Real name fields; `"Unknown"` when the user has not set them. */
  firstName: string;
  name: string;
  banned: boolean;
  level: number;
  paragon: number;
  experienceProgress: number;
  following: number;
  followers: number;
  hasCountedFollowing: boolean;
  hasCountedFollowers: boolean;
  jamAttempts: number;
  jamStarStreak: number;
  jamLongestStarStreak: number;
  jamWorldPlayerRanking: number;
}

export interface GetUserDataParams<TGame extends GameDefinition> {
  /** Friendly section names, mapped to backend keys through the game definition. */
  sections: readonly SectionKey<TGame>[];
  /** Raw backend keys for sections this wrapper does not know about. */
  keys?: readonly string[];
  /**
   * Read another user instead of the caller. When set, the call is made as a
   * guest with this `userId` inside `data`, and only public sections return.
   */
  userId?: string;
}

/** Section wire-name (e.g. `private-profile`) -> JSON-encoded section payload. */
export interface UserDataSections {
  [section: string]: string;
}

/** Section wire-name -> whether the section is publicly visible. */
export interface UserDataVisibility {
  [section: string]: boolean;
}

export interface WalletRealMoneyPurchases {
  sendCount: number;
  installId: string;
}

/** The wallet snapshot uploaded alongside profile sections in `setUserData`. */
export interface Wallet extends UnknownFields {
  newRealMoneyPurchases?: WalletRealMoneyPurchases;
  /** JSON-encoded virtual-goods blob. */
  virtualGoods?: string;
  /** Human-readable purchase ledger, one entry per line. */
  virtualPurchaseLog?: readonly string[];
}

export interface SetUserDataParams {
  data: UserDataSections;
  isPublic?: UserDataVisibility;
  /** Wallet snapshot (currencies, owned goods, purchase log). */
  wallet?: Wallet;
  /** Account level. */
  level?: number;
  /** Local install/owner id the session was created under. */
  ownerId?: string;
  /** Monotonic client game-version counter. A 64-bit value that can exceed `Number.MAX_SAFE_INTEGER`. */
  gameVersionNumber?: number;
}

/** Establishes the write session before `setUserData`. */
export interface SetUserDataSessionParams {
  ownerId: string;
  lastTimestamp: number;
  /** Monotonic client game-version counter. A 64-bit value that can exceed `Number.MAX_SAFE_INTEGER`. */
  gameVersionNumber: number;
}

/** Identity provider ids to check; unset ones are sent as `null`. */
export interface IsConnectedParams {
  appleId?: string | null;
  facebookId?: string | null;
  appFacebookId?: string | null;
  facebookAccessToken?: string | null;
  twitterId?: string | null;
  email?: string | null;
  googlePlayId?: string | null;
  gameCenterId?: string | null;
  legacyGameCenterId?: string | null;
  gameCircleId?: string | null;
  steamId?: string | null;
}

export interface LoginAppleParams {
  appleId: string;
  /** Apple only returns the relay email on the first authorization; `null` afterwards. */
  email: string | null;
  /** E.g. `GMT+2`. */
  timeZone: string;
}

export interface GetFollowingParams {
  pageSize: number;
  cursor?: string | null;
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

export interface GetHighscoreAtScoreParams extends BoardIdParams {
  /** The score to look up the highscore at, e.g. `41026556`. */
  referenceScore: number;
}

export interface GetHighscoresParams {
  boardIds: readonly string[];
  /** Whose highscores to read. `null` (the default) uses the authenticated caller. */
  userId?: string | null;
}

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
