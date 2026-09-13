export type JsonValue = string | number | boolean | null | JsonValue[] | JSON;

export interface JSON {
  [key: string]: JsonValue;
}

export interface ApiRequestBody {
  version: string;
  game: string;
  gameVersion: string;
  platform: string;
  language: string;
  data: JSON;
}

export interface AbstractConstructorOptions {
  debug?: boolean;
  userId: string;
  password?: string;
}

export interface BaseConstructorOptions extends AbstractConstructorOptions {
  game: string;
  baseJson?: JSON;
}

export interface BaseInterface {
  debug: boolean;
}

export interface FetchRequestBody {
  body?: JSON;
  data?: JSON;
}

export interface FetchOptions {
  path: string;
  body?: FetchRequestBody;
}

export interface FetchResponse {
  serverTime: number;
  result: string;
  errorMessage?: string;
}

export interface getUserDataOpts {
  privateProfile?: boolean;
  publicProfile?: boolean;
  achievementSystem?: boolean;
  payments?: boolean;
  userId?: string;
}

export interface GetRankFromScoreOptions {
  boardIds: string[];
  scores?: number[] | null;
  preciseRankLimit?: number;
  lightweight?: boolean;
}

export interface GetLeaderboardPageOptions {
  boardId: string;
  pageSize: number;
  cursor?: string | null;
}

export interface SetHighscoreOptions {
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

export interface SetUserDataOptions {
  data: JSON;
  isPublic?: JSON;
}

export interface UpdateJamRoundStatsOptions {
  roundId: string;
  attemptsSinceLastUpdate: number[];
  defeatedPlayersSinceLastUpdate: number;
}

export interface SetNotificationSettingsOptions {
  addDeviceToken?: string;
  removeDeviceToken?: string | null;
  settings?: JSON | null;
  isFirebaseSandbox?: boolean;
}

export interface GetPvpChallengesOptions {
  status?: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface ContinuePvpChallengeOptions {
  previousChallengeId: string;
  level: string;
  timeStart: number;
}

export interface FinishPvpChallengeOptions {
  challengeId: string;
  pairingNumber: number;
  secondaryPairingNumber: number;
}

export interface UpdatePvpChallengeOptions {
  challengeId: string;
  secondaryScore: number;
  timeUsed: number;
  timeAdded: number;
  checksum: number;
  score: number;
}
