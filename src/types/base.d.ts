type JsonValue = string | number | boolean | null | JsonValue[] | JSON;

interface JSON {
  [key: string]: JsonValue;
}

interface ApiRequestBody {
  version: string;
  game: string;
  gameVersion: string;
  platform: string;
  language: string;
  data: JSON;
}

interface AbstractConstructorOptions {
  debug?: boolean;
  userId: string;
  password?: string;
}

interface BaseConstructorOptions extends AbstractConstructorOptions {
  game: string;
  baseJson?: JSON;
}

interface BaseInterface {
  debug: boolean;
}

interface FetchRequestBody {
  body?: JSON;
  data?: JSON;
}

interface FetchOptions {
  path: string;
  body?: FetchRequestBody;
}

interface FetchResponse {
  serverTime: number;
  result: string;
  errorMessage?: string;
}

interface getUserDataOpts {
  privateProfile?: boolean;
  publicProfile?: boolean;
  achievementSystem?: boolean;
  payments?: boolean;
  userId?: string;
}

interface GetRankFromScoreOptions {
  boardIds: string[];
  scores?: number[] | null;
  preciseRankLimit?: number;
  lightweight?: boolean;
}

interface GetLeaderboardPageOptions {
  boardId: string;
  pageSize: number;
  cursor?: string | null;
}

interface SetHighscoreOptions {
  boardId: string[];
  boardName: string[];
  rankBoards: boolean;
  rankedBoards: boolean[];
  score: number;
  properties: JSON;
  uploaded: boolean;
  UUID: string;
  blobless: boolean;
  createdInGameVersion: string;
}

interface SetUserDataOptions {
  data: JSON;
  isPublic?: JSON;
}

interface UpdateJamRoundStatsOptions {
  roundId: string;
  attemptsSinceLastUpdate: number[];
  defeatedPlayersSinceLastUpdate: number;
}

interface SetNotificationSettingsOptions {
  addDeviceToken?: string;
  removeDeviceToken?: string | null;
  settings?: JSON | null;
  isFirebaseSandbox?: boolean;
}

interface GetPvpChallengesOptions {
  status?: string;
  cursor?: string | null;
  pageSize?: number;
}

interface ContinuePvpChallengeOptions {
  previousChallengeId: string;
  level: string;
  timeStart: number;
}

interface FinishPvpChallengeOptions {
  challengeId: string;
  pairingNumber: number;
  secondaryPairingNumber: number;
}

interface UpdatePvpChallengeOptions {
  challengeId: string;
  secondaryScore: number;
  timeUsed: number;
  timeAdded: number;
  checksum: number;
  score: number;
}

export type {
  AbstractConstructorOptions,
  ApiRequestBody,
  BaseConstructorOptions,
  BaseInterface,
  ContinuePvpChallengeOptions,
  FetchOptions,
  FetchRequestBody,
  FetchResponse,
  FinishPvpChallengeOptions,
  GetLeaderboardPageOptions,
  GetPvpChallengesOptions,
  GetRankFromScoreOptions,
  getUserDataOpts,
  JSON,
  SetHighscoreOptions,
  SetNotificationSettingsOptions,
  SetUserDataOptions,
  UpdateJamRoundStatsOptions,
  UpdatePvpChallengeOptions,
};
