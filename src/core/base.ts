import type {
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
  SetHighscoreOptions,
  SetNotificationSettingsOptions,
  SetUserDataOptions,
  UpdateJamRoundStatsOptions,
  UpdatePvpChallengeOptions,
} from "@/src/types/base";

abstract class Base implements BaseInterface {
  private readonly baseUrl: string =
    "https://production-dot-turborillanet.appspot.com/";
  private readonly headers: Record<string, string>;
  private readonly baseJson: ApiRequestBody;
  public debug: boolean;
  public authenticated: boolean;
  private readonly game: string;

  constructor(options: BaseConstructorOptions) {
    this.headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MadSkillsMX/4544 CFNetwork/1408.0.4 Darwin/22.5.0",
    };
    this.debug = options.debug || false;
    this.authenticated = false;
    this.game = options.game;

    this.baseJson = {
      data: {},
      game: `${options.game}-release`,
      gameVersion: "2.35.4544",
      language: "EN",
      platform: "ios",
      userId: options.userId,
      version: "1.0",
    };

    if (options.password) {
      this.baseJson.password = options.password;
      this.authenticated = true;
    }

    if (options.baseJson) {
      this.baseJson = Object.assign(this.baseJson, options.baseJson);
    }
  }

  async fetch<T>(options: FetchOptions): Promise<T & FetchResponse> {
    this.log(
      `fetch (/${options.path}) - ${this.authenticated ? "User 🔐" : "Guest 🌐"}`
    );

    const json = Base.encodeJson(this.mergeJson(options.body || {}));

    const response = await fetch(`${this.baseUrl}${options.path}`, {
      body: `json=${json}`,
      headers: this.headers,
      method: "POST",
    });

    let data: T & FetchResponse;
    try {
      // SAFETY: the API always responds with a JSON body shaped as T & FetchResponse; the `result` field is validated right after.
      data = (await response.json()) as T & FetchResponse;
    } catch {
      return this.error(
        `could not parse json, (${response.status} - ${response.statusText})`
      );
    }

    if (data.result !== "SUCCESS" || (data.errorMessage?.length ?? 0) > 0) {
      return this.error(`${data.errorMessage} (${data.result})`);
    }
    if (!response.ok) {
      return this.error(
        `Response not ok (${response.status} - ${response.statusText})`
      );
    }

    return data;
  }

  log(...args: unknown[]) {
    if (!this.debug) {
      return;
    }
    return console.log(`[MadSkills Wrapper] (${this.game})`, ...args);
  }

  error(message: string) {
    this.log(message);
    return Promise.reject(new Error(`${message} ❌`));
  }

  static encodeJson(json: ApiRequestBody) {
    return encodeURIComponent(JSON.stringify(json));
  }

  mergeJson(json: FetchRequestBody) {
    return {
      ...this.baseJson,
      ...json.body,
      data: {
        ...this.baseJson.data,
        ...json.data,
      },
    };
  }

  async getServerTime() {
    const data = await this.fetch({
      path: "getservertime",
    });
    return data.serverTime;
  }

  async getCurrentEvent() {
    const data = await this.fetch({
      path: "getcurrentevent",
    });
    return data;
  }

  async getCurrentGameEvents() {
    const data = await this.fetch({
      path: "getcurrentgameevents",
    });
    return data;
  }

  async isUsernameAvailable(username: string, suggestAlternatives = true) {
    const data = await this.fetch({
      body: {
        data: {
          suggestAlternatives,
          username,
        },
      },
      path: "isusernameavailable",
    });
    return data;
  }

  async getCurrentJamRound() {
    const data = await this.fetch({
      path: "jam/getcurrentround",
    });
    return data;
  }

  // oxlint-disable-next-line class-methods-use-this -- subclasses override this to extend the key map via super
  getUserDataMappings() {
    return {
      achievementSystem: "achievement system",
      payments: "payments",
      privateProfile: "private-profile",
      publicProfile: "public-profile",
    };
  }

  async getUserData(options: getUserDataOpts) {
    const keyMappings: Record<string, string> = this.getUserDataMappings();

    const keys: string[] = [];
    for (const [option, value] of Object.entries(options)) {
      if (option === "userId" || value !== true) {
        continue;
      }
      const mapped = keyMappings[option];
      if (mapped) {
        keys.push(mapped);
      }
    }

    // userId is a top-level envelope field, never nested inside data.
    const body: FetchRequestBody = { data: { keys } };
    if (options.userId) {
      body.body = { userId: options.userId };
    }

    return await this.fetch({
      body,
      path: "getuserdata",
    });
  }

  async getUser(username: string) {
    return await this.fetch({
      body: {
        data: {
          userId: null,
          username,
        },
      },
      path: "getuser",
    });
  }

  // The endpoints below are shared by every game (MX2 and BMX2). Their request
  // payloads were modelled from captured production traffic.

  // --- Users & social ---

  async getUserAvatar(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "getuseravatar",
    });
  }

  async isFollowing(userIds: string[]) {
    return await this.fetch({
      body: { data: { userIds } },
      path: "isfollowing",
    });
  }

  async isFollowingMe(userIds: string[]) {
    return await this.fetch({
      body: { data: { userIds } },
      path: "isfollowingme",
    });
  }

  async setFollowing(userIds: string[]) {
    return await this.fetch({
      body: { data: { userIds } },
      path: "setfollowing",
    });
  }

  async setUnfollowed(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "setunfollowed",
    });
  }

  async setUserData(options: SetUserDataOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "setuserdata",
    });
  }

  // --- Leaderboards & scores ---

  async getRankFromScore(options: GetRankFromScoreOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "getrankfromscore",
    });
  }

  async getBestScores(boardIds: string[]) {
    return await this.fetch({
      body: { data: { boardIds } },
      path: "getbestscores",
    });
  }

  async getBetterHighscore(
    boardId: string,
    referenceScore: number | null = null
  ) {
    return await this.fetch({
      body: { data: { boardId, referenceScore } },
      path: "getbetterhighscore",
    });
  }

  async getHighscoreBlob(boardId: string, userId: string) {
    return await this.fetch({
      body: { data: { boardId, userId } },
      path: "gethighscoreblob",
    });
  }

  async setHighscore(options: SetHighscoreOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "sethighscore",
    });
  }

  async getLeaderboardPage(options: GetLeaderboardPageOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "getleaderboardpage",
    });
  }

  async getFollowingLeaderboard(boardId: string) {
    return await this.fetch({
      body: { data: { boardId } },
      path: "getfollowingleaderboard",
    });
  }

  // --- Levels ---

  async downloadLevel(levelId: string) {
    return await this.fetch({
      body: { data: { levelId } },
      path: "downloadlevel",
    });
  }

  // --- Jam ---

  async getJamRound(roundId: string) {
    return await this.fetch({
      body: { data: { roundId } },
      path: "jam/getround",
    });
  }

  async updateJamRoundStats(options: UpdateJamRoundStatsOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "jam/updateroundstats",
    });
  }

  // --- Notifications ---

  async getNotificationSettings() {
    return await this.fetch({
      path: "getnotificationsettings",
    });
  }

  async setNotificationSettings(options: SetNotificationSettingsOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "setnotificationsettings",
    });
  }

  async setNotificationFrequency(frequency: string) {
    return await this.fetch({
      body: { data: { frequency } },
      path: "setnotificationfrequency",
    });
  }

  // --- PvP ---

  async getPvpBadges() {
    return await this.fetch({
      path: "pvp/getbadges",
    });
  }

  async clearPvpBadges() {
    return await this.fetch({
      path: "pvp/clearbadges",
    });
  }

  async getPvpLevels() {
    return await this.fetch({
      path: "pvp/getlevels",
    });
  }

  async getPvpChallenges(options: GetPvpChallengesOptions = {}) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "pvp/getchallenges",
    });
  }

  async getPvpChallengeResults(challengeId: string) {
    return await this.fetch({
      body: { data: { challengeId } },
      path: "pvp/getchallengeresults",
    });
  }

  async getPvpChallengeUserSettings() {
    return await this.fetch({
      path: "pvp/getchallengeusersettings",
    });
  }

  async setPvpChallengeUserSettings(isTauntEnabled: boolean) {
    return await this.fetch({
      body: { data: { isTauntEnabled } },
      path: "pvp/setchallengeusersettings",
    });
  }

  async claimPvpReward(rewardId: string) {
    return await this.fetch({
      body: { data: { rewardId } },
      path: "pvp/claimreward",
    });
  }

  async continuePvpChallenge(options: ContinuePvpChallengeOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "pvp/continuechallenge",
    });
  }

  async deletePvpChallenge(challengeId: string) {
    return await this.fetch({
      body: { data: { challengeId } },
      path: "pvp/deletechallenge",
    });
  }

  async finishPvpChallenge(options: FinishPvpChallengeOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "pvp/finishchallenge",
    });
  }

  async pokePvpChallenge(challengeId: string) {
    return await this.fetch({
      body: { data: { challengeId } },
      path: "pvp/pokechallenge",
    });
  }

  async updatePvpChallenge(options: UpdatePvpChallengeOptions) {
    return await this.fetch({
      body: { data: { ...options } },
      path: "pvp/updatechallenge",
    });
  }
}

export default Base;
