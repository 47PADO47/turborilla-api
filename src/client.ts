import type { Logger } from "@padosoft/logger";

import { Assets } from "./assets";
import type { FetchLike } from "./assets";
import {
  DEFAULT_BASE_URL,
  DEFAULT_HEADERS,
  FORM_CONTENT_TYPE,
} from "./constants";
import { buildEnvelope, encodeBody } from "./envelope";
import type { EnvelopeOverrides } from "./envelope";
import { TurborillaError } from "./errors";
import type { GameDefinition } from "./games/definition";
import type { Access, CallArgs, Credentials } from "./types/credentials";
import type {
  BoardIdParams,
  ChallengeIdParams,
  ClaimPvpRewardParams,
  ContinuePvpChallengeParams,
  DownloadLevelParams,
  FinishPvpChallengeParams,
  GetBestScoresParams,
  GetBetterHighscoreParams,
  GetFollowingParams,
  GetHighscoreAtScoreParams,
  GetHighscoreBlobParams,
  GetHighscoresParams,
  GetJamRoundParams,
  GetLeaderboardPageParams,
  GetPvpChallengesParams,
  GetRankFromScoreParams,
  GetUserDataParams,
  GetUserParams,
  GetUserResponse,
  IsConnectedParams,
  IsUsernameAvailableParams,
  LoginAppleParams,
  SetHighscoreParams,
  SetNotificationFrequencyParams,
  SetNotificationSettingsParams,
  SetPvpChallengeUserSettingsParams,
  SetUserDataParams,
  SetUserDataSessionParams,
  UpdateJamRoundStatsParams,
  UpdatePvpChallengeParams,
  UserIdParams,
  UserIdsParams,
} from "./types/endpoints";
import type {
  ApiResponse,
  EmptyObject,
  ServerTimeFields,
  UnknownFields,
} from "./types/response";

export interface ClientOptions<
  TCredentials extends Credentials | undefined = undefined,
> {
  /**
   * Bind credentials to every request. Omit them to get an unbound client that
   * requires `credentials` per call on user endpoints (handy server side).
   */
  credentials?: TCredentials;
  /** Defaults to the global `fetch`, resolved at call time. */
  fetch?: FetchLike | undefined;
  logger?: Logger | undefined;
  baseUrl?: string | undefined;
  assetsBaseUrl?: string | undefined;
  flagsBaseUrl?: string | undefined;
  headers?: Record<string, string> | undefined;
  /** Override or extend the static envelope fields for every request. */
  envelope?: EnvelopeOverrides | undefined;
}

/** A raw backend request, for `request`. */
export interface EndpointRequest {
  path: string;
  /** `POST` (the default) sends the envelope; `GET` sends no body. */
  method?: "GET" | "POST" | undefined;
  data?: object | undefined;
  credentials?: Credentials | undefined;
  signal?: AbortSignal | undefined;
}

interface CallFields {
  credentials?: Credentials | undefined;
  signal?: AbortSignal | undefined;
}

/** The params object as seen inside the client, where `TCredentials` is still generic. */
export type LooseParams<TParams extends object> = TParams & CallFields;

export interface ResolvedCall<TParams extends object> {
  credentials: Credentials | undefined;
  data: Omit<LooseParams<TParams>, keyof CallFields>;
  signal: AbortSignal | undefined;
}

const isRecord = (value: unknown): value is UnknownFields =>
  Object(value) === value;

const hasText = (value: unknown): value is string =>
  value !== undefined && value !== null && value !== "";

/**
 * Generic client for a Turborilla game backend.
 *
 * `TCredentials` records whether credentials were bound in the constructor:
 * when they were, user endpoints take only their own params; otherwise they
 * also require `credentials` in the params object.
 */
export class TurborillaClient<
  TGame extends GameDefinition,
  TCredentials extends Credentials | undefined = undefined,
> {
  readonly game: TGame;
  /** Client for the public assets CDN, sharing the same `fetch` and logger. */
  readonly assets: Assets;
  protected readonly credentials: Credentials | undefined;
  private readonly fetchImpl: FetchLike | undefined;
  private readonly logger: Logger | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly envelopeOverrides: EnvelopeOverrides | undefined;

  constructor(game: TGame, options: ClientOptions<TCredentials> = {}) {
    this.game = game;
    this.credentials = options.credentials;
    this.fetchImpl = options.fetch;
    this.logger = options.logger;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.headers = {
      ...DEFAULT_HEADERS,
      "Content-Type": FORM_CONTENT_TYPE,
      ...options.headers,
    };
    this.envelopeOverrides = options.envelope;
    this.assets = new Assets({
      baseUrl: options.assetsBaseUrl ?? game.assetsBaseUrl,
      fetch: options.fetch,
      flagsBaseUrl: options.flagsBaseUrl,
      logger: options.logger,
    });
  }

  /** Whether the bound credentials include a password. */
  get authenticated(): boolean {
    return this.credentials?.password !== undefined;
  }

  // --- Internals (protected so subclasses can add endpoints) ---

  /**
   * Split the params object of a call into credentials, payload and request
   * options. Per-call credentials win over bound ones; user endpoints throw
   * when neither exists.
   */
  protected resolve<TParams extends object>(
    args: readonly [LooseParams<TParams>?],
    access: Access
  ): ResolvedCall<TParams> {
    // SAFETY: `CallArgs` only makes the params element optional when every field in it is optional.
    const {
      credentials: override,
      signal,
      ...data
    } = (args[0] ?? {}) as LooseParams<TParams>;
    const credentials = override ?? this.credentials;

    if (access === "user" && credentials === undefined) {
      throw this.fail(
        new TurborillaError(
          "This endpoint needs credentials: bind them in the constructor or pass `credentials` in the call.",
          { code: "MISSING_CREDENTIALS" }
        )
      );
    }

    return { credentials, data, signal };
  }

  /** Resolve the call, then post its payload to `path`. Always rejects, never throws. */
  protected async call<
    TParams extends object,
    TData extends object = ServerTimeFields,
  >(
    path: string,
    access: Access,
    args: readonly [LooseParams<TParams>?]
  ): Promise<ApiResponse<TData>> {
    const { credentials, data, signal } = this.resolve<TParams>(args, access);
    return await this.request<TData>({ credentials, data, path, signal });
  }

  /** Send a raw request and validate the response envelope. */
  protected async request<TData extends object = ServerTimeFields>(
    request: EndpointRequest
  ): Promise<ApiResponse<TData>> {
    const url = `${this.baseUrl}${request.path}`;
    const method = request.method ?? "POST";
    const init: RequestInit = { headers: this.headers, method };

    if (method === "POST") {
      init.body = encodeBody(
        buildEnvelope({
          credentials: request.credentials,
          data: request.data,
          game: this.game,
          overrides: this.envelopeOverrides,
        })
      );
    }
    if (request.signal) {
      init.signal = request.signal;
    }

    this.logger?.debug(
      `[turborilla] ${this.game.id} ${method} /${request.path}`,
      {
        authenticated: request.credentials?.password !== undefined,
        guest: request.credentials === undefined,
      }
    );

    const fetchImpl = this.fetchImpl ?? globalThis.fetch;
    const response = await fetchImpl(url, init);
    return await this.parse<TData>(response, url);
  }

  private async parse<TData extends object>(
    response: Response,
    url: string
  ): Promise<ApiResponse<TData>> {
    const { status, statusText } = response;
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw this.fail(
        new TurborillaError(
          `Could not parse JSON from ${url} (${status} ${statusText})`,
          { cause: error, code: "INVALID_JSON", status, url }
        )
      );
    }

    if (!isRecord(payload)) {
      throw this.fail(
        new TurborillaError(`Unexpected response shape from ${url}`, {
          code: "INVALID_JSON",
          status,
          url,
        })
      );
    }

    const result = String(payload["result"]);
    const { errorMessage } = payload;
    if (result !== "SUCCESS" || hasText(errorMessage)) {
      throw this.fail(
        new TurborillaError(
          `${hasText(errorMessage) ? errorMessage : "Request failed"} (${result})`,
          {
            code: "API_ERROR",
            errorMessage: hasText(errorMessage) ? errorMessage : undefined,
            result,
            status,
            url,
          }
        )
      );
    }

    if (!response.ok) {
      throw this.fail(
        new TurborillaError(`Response not ok (${status} ${statusText})`, {
          code: "HTTP_ERROR",
          result,
          status,
          url,
        })
      );
    }

    // SAFETY: `result` was validated above; documented fields are trusted as returned and everything else stays `unknown` behind the index signature.
    return payload as ApiResponse<TData>;
  }

  private fail(error: TurborillaError): TurborillaError {
    this.logger?.error(error.message, error);
    return error;
  }

  // --- Server & events (public) ---

  async getServerTime(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<number> {
    const { serverTime } = await this.call<EmptyObject>(
      "getservertime",
      "public",
      args
    );
    return serverTime;
  }

  getCurrentEvent(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("getcurrentevent", "public", args);
  }

  getCurrentGameEvents(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("getcurrentgameevents", "public", args);
  }

  // --- Users & social ---

  async isUsernameAvailable(
    ...args: CallArgs<TCredentials, "public", IsUsernameAvailableParams>
  ): Promise<ApiResponse> {
    const { credentials, data, signal } =
      this.resolve<IsUsernameAvailableParams>(args, "public");
    return await this.request({
      credentials,
      data: { suggestAlternatives: true, ...data },
      path: "isusernameavailable",
      signal,
    });
  }

  /** Look a user up by `username` or by `userId`. */
  async getUser(
    ...args: CallArgs<TCredentials, "public", GetUserParams>
  ): Promise<ApiResponse<GetUserResponse>> {
    const { credentials, data, signal } = this.resolve<GetUserParams>(
      args,
      "public"
    );
    return await this.request<GetUserResponse>({
      credentials,
      data: { userId: null, ...data },
      path: "getuser",
      signal,
    });
  }

  getUserAvatar(
    ...args: CallArgs<TCredentials, "public", UserIdParams>
  ): Promise<ApiResponse> {
    return this.call<UserIdParams>("getuseravatar", "public", args);
  }

  /**
   * Check whether any identity provider id is already linked to an account.
   * Unset providers are sent as `null`, matching the game client.
   */
  async isConnected(
    ...args: CallArgs<TCredentials, "public", IsConnectedParams>
  ): Promise<ApiResponse> {
    const { credentials, data, signal } = this.resolve<IsConnectedParams>(
      args,
      "public"
    );
    return await this.request({
      credentials,
      data: {
        appFacebookId: null,
        appleId: null,
        email: null,
        facebookAccessToken: null,
        facebookId: null,
        gameCenterId: null,
        gameCircleId: null,
        googlePlayId: null,
        legacyGameCenterId: null,
        steamId: null,
        twitterId: null,
        ...data,
      },
      path: "isconnected",
      signal,
    });
  }

  /** Sign in with Apple. Returns the account credentials on success. */
  loginApple(
    ...args: CallArgs<TCredentials, "public", LoginAppleParams>
  ): Promise<ApiResponse> {
    return this.call<LoginAppleParams>("login/apple", "public", args);
  }

  /**
   * Fetch profile data sections. The request is built one of two ways:
   *
   * - **Own profile** (no `userId`): an authenticated call (credentials at the
   *   envelope top level), `data` carries only `keys`. Private sections need
   *   credentials.
   * - **Another user** (`userId` set): a guest call (no credentials), the
   *   target `userId` travels inside `data`. Only public sections come back;
   *   private keys can be requested but are silently omitted.
   */
  async getUserData(
    ...args: CallArgs<TCredentials, "public", GetUserDataParams<TGame>>
  ): Promise<ApiResponse> {
    const { credentials, data, signal } = this.resolve<
      GetUserDataParams<TGame>
    >(args, "public");

    const keys: string[] = [
      ...data.sections.map(
        (section) => this.game.userDataSections[section] ?? section
      ),
      ...(data.keys ?? []),
    ];

    // Reading another user is a guest call with the target userId inside data.
    if (data.userId !== undefined) {
      return await this.request({
        credentials: undefined,
        data: { keys, userId: data.userId },
        path: "getuserdata",
        signal,
      });
    }

    return await this.request({
      credentials,
      data: { keys },
      path: "getuserdata",
      signal,
    });
  }

  isFollowing(
    ...args: CallArgs<TCredentials, "user", UserIdsParams>
  ): Promise<ApiResponse> {
    return this.call<UserIdsParams>("isfollowing", "user", args);
  }

  isFollowingMe(
    ...args: CallArgs<TCredentials, "user", UserIdsParams>
  ): Promise<ApiResponse> {
    return this.call<UserIdsParams>("isfollowingme", "user", args);
  }

  setFollowing(
    ...args: CallArgs<TCredentials, "user", UserIdsParams>
  ): Promise<ApiResponse> {
    return this.call<UserIdsParams>("setfollowing", "user", args);
  }

  setUnfollowed(
    ...args: CallArgs<TCredentials, "user", UserIdParams>
  ): Promise<ApiResponse> {
    return this.call<UserIdParams>("setunfollowed", "user", args);
  }

  /** Page through the users the caller follows. */
  getFollowing(
    ...args: CallArgs<TCredentials, "user", GetFollowingParams>
  ): Promise<ApiResponse> {
    return this.call<GetFollowingParams>("getfollowing", "user", args);
  }

  setUserData(
    ...args: CallArgs<TCredentials, "user", SetUserDataParams>
  ): Promise<ApiResponse> {
    return this.call<SetUserDataParams>("setuserdata", "user", args);
  }

  /** Open the write session that precedes a `setUserData` upload. */
  setUserDataSession(
    ...args: CallArgs<TCredentials, "user", SetUserDataSessionParams>
  ): Promise<ApiResponse> {
    return this.call<SetUserDataSessionParams>(
      "setuserdatasession",
      "user",
      args
    );
  }

  // --- Leaderboards & scores ---

  getRankFromScore(
    ...args: CallArgs<TCredentials, "user", GetRankFromScoreParams>
  ): Promise<ApiResponse> {
    return this.call<GetRankFromScoreParams>("getrankfromscore", "user", args);
  }

  getBestScores(
    ...args: CallArgs<TCredentials, "user", GetBestScoresParams>
  ): Promise<ApiResponse> {
    return this.call<GetBestScoresParams>("getbestscores", "user", args);
  }

  async getBetterHighscore(
    ...args: CallArgs<TCredentials, "user", GetBetterHighscoreParams>
  ): Promise<ApiResponse> {
    const { credentials, data, signal } =
      this.resolve<GetBetterHighscoreParams>(args, "user");
    return await this.request({
      credentials,
      data: { referenceScore: null, ...data },
      path: "getbetterhighscore",
      signal,
    });
  }

  getHighscoreBlob(
    ...args: CallArgs<TCredentials, "public", GetHighscoreBlobParams>
  ): Promise<ApiResponse> {
    return this.call<GetHighscoreBlobParams>(
      "gethighscoreblob",
      "public",
      args
    );
  }

  getHighscoreAtScore(
    ...args: CallArgs<TCredentials, "public", GetHighscoreAtScoreParams>
  ): Promise<ApiResponse> {
    return this.call<GetHighscoreAtScoreParams>(
      "gethighscoreatscore",
      "public",
      args
    );
  }

  /**
   * Read a user's highscores across boards. Pass `userId` to read any user as
   * a guest; omit it (or pass `null`) to read the authenticated caller.
   */
  async getHighscores(
    ...args: CallArgs<TCredentials, "public", GetHighscoresParams>
  ): Promise<ApiResponse> {
    const { credentials, data, signal } = this.resolve<GetHighscoresParams>(
      args,
      "public"
    );
    return await this.request({
      credentials,
      data: { userId: null, ...data },
      path: "gethighscores",
      signal,
    });
  }

  setHighscore(
    ...args: CallArgs<TCredentials, "user", SetHighscoreParams>
  ): Promise<ApiResponse> {
    return this.call<SetHighscoreParams>("sethighscore", "user", args);
  }

  getLeaderboardPage(
    ...args: CallArgs<TCredentials, "public", GetLeaderboardPageParams>
  ): Promise<ApiResponse> {
    return this.call<GetLeaderboardPageParams>(
      "getleaderboardpage",
      "public",
      args
    );
  }

  getFollowingLeaderboard(
    ...args: CallArgs<TCredentials, "user", BoardIdParams>
  ): Promise<ApiResponse> {
    return this.call<BoardIdParams>("getfollowingleaderboard", "user", args);
  }

  // --- Levels & jam ---

  downloadLevel(
    ...args: CallArgs<TCredentials, "public", DownloadLevelParams>
  ): Promise<ApiResponse> {
    return this.call<DownloadLevelParams>("downloadlevel", "public", args);
  }

  getCurrentJamRound(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("jam/getcurrentround", "public", args);
  }

  getJamRound(
    ...args: CallArgs<TCredentials, "public", GetJamRoundParams>
  ): Promise<ApiResponse> {
    return this.call<GetJamRoundParams>("jam/getround", "public", args);
  }

  updateJamRoundStats(
    ...args: CallArgs<TCredentials, "user", UpdateJamRoundStatsParams>
  ): Promise<ApiResponse> {
    return this.call<UpdateJamRoundStatsParams>(
      "jam/updateroundstats",
      "user",
      args
    );
  }

  // --- Notifications ---

  getNotificationSettings(
    ...args: CallArgs<TCredentials, "user">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("getnotificationsettings", "user", args);
  }

  setNotificationSettings(
    ...args: CallArgs<TCredentials, "user", SetNotificationSettingsParams>
  ): Promise<ApiResponse> {
    return this.call<SetNotificationSettingsParams>(
      "setnotificationsettings",
      "user",
      args
    );
  }

  setNotificationFrequency(
    ...args: CallArgs<TCredentials, "user", SetNotificationFrequencyParams>
  ): Promise<ApiResponse> {
    return this.call<SetNotificationFrequencyParams>(
      "setnotificationfrequency",
      "user",
      args
    );
  }

  // --- PvP ---

  getPvpLevels(
    ...args: CallArgs<TCredentials, "public">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("pvp/getlevels", "public", args);
  }

  getPvpBadges(...args: CallArgs<TCredentials, "user">): Promise<ApiResponse> {
    return this.call<EmptyObject>("pvp/getbadges", "user", args);
  }

  clearPvpBadges(
    ...args: CallArgs<TCredentials, "user">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("pvp/clearbadges", "user", args);
  }

  getPvpChallenges(
    ...args: CallArgs<TCredentials, "user", GetPvpChallengesParams>
  ): Promise<ApiResponse> {
    return this.call<GetPvpChallengesParams>("pvp/getchallenges", "user", args);
  }

  getPvpChallengeResults(
    ...args: CallArgs<TCredentials, "user", ChallengeIdParams>
  ): Promise<ApiResponse> {
    return this.call<ChallengeIdParams>(
      "pvp/getchallengeresults",
      "user",
      args
    );
  }

  getPvpChallengeUserSettings(
    ...args: CallArgs<TCredentials, "user">
  ): Promise<ApiResponse> {
    return this.call<EmptyObject>("pvp/getchallengeusersettings", "user", args);
  }

  setPvpChallengeUserSettings(
    ...args: CallArgs<TCredentials, "user", SetPvpChallengeUserSettingsParams>
  ): Promise<ApiResponse> {
    return this.call<SetPvpChallengeUserSettingsParams>(
      "pvp/setchallengeusersettings",
      "user",
      args
    );
  }

  claimPvpReward(
    ...args: CallArgs<TCredentials, "user", ClaimPvpRewardParams>
  ): Promise<ApiResponse> {
    return this.call<ClaimPvpRewardParams>("pvp/claimreward", "user", args);
  }

  continuePvpChallenge(
    ...args: CallArgs<TCredentials, "user", ContinuePvpChallengeParams>
  ): Promise<ApiResponse> {
    return this.call<ContinuePvpChallengeParams>(
      "pvp/continuechallenge",
      "user",
      args
    );
  }

  deletePvpChallenge(
    ...args: CallArgs<TCredentials, "user", ChallengeIdParams>
  ): Promise<ApiResponse> {
    return this.call<ChallengeIdParams>("pvp/deletechallenge", "user", args);
  }

  finishPvpChallenge(
    ...args: CallArgs<TCredentials, "user", FinishPvpChallengeParams>
  ): Promise<ApiResponse> {
    return this.call<FinishPvpChallengeParams>(
      "pvp/finishchallenge",
      "user",
      args
    );
  }

  pokePvpChallenge(
    ...args: CallArgs<TCredentials, "user", ChallengeIdParams>
  ): Promise<ApiResponse> {
    return this.call<ChallengeIdParams>("pvp/pokechallenge", "user", args);
  }

  updatePvpChallenge(
    ...args: CallArgs<TCredentials, "user", UpdatePvpChallengeParams>
  ): Promise<ApiResponse> {
    return this.call<UpdatePvpChallengeParams>(
      "pvp/updatechallenge",
      "user",
      args
    );
  }
}
