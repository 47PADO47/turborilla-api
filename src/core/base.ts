import type {
  ApiRequestBody,
  BaseConstructorOptions,
  BaseInterface,
  FetchOptions,
  FetchRequestBody,
  FetchResponse,
  getUserDataOpts,
  JSON as JsonRecord,
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
      data: {
        userId: options.userId,
      },
      game: `${options.game}-release`,
      gameVersion: "2.35.4544",
      language: "EN",
      platform: "ios",
      version: "1.0",
    };

    if (options.password) {
      this.baseJson.data["password"] = options.password;
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

    const data: JsonRecord = {
      keys,
    };
    if (options.userId) {
      data["userId"] = options.userId;
    }

    return await this.fetch({
      body: {
        data,
      },
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

  // The endpoints below are shared by every game (MX2 and BMX2). Only the
  // request paths were captured, so parameterized endpoints accept a flexible
  // `data` object; callers supply the fields the endpoint expects.

  // --- Users & social ---

  async getUserAvatar(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "getuseravatar",
    });
  }

  async isFollowing(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "isfollowing",
    });
  }

  async isFollowingMe(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "isfollowingme",
    });
  }

  async setFollowing(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "setfollowing",
    });
  }

  async setUnfollowed(userId: string) {
    return await this.fetch({
      body: { data: { userId } },
      path: "setunfollowed",
    });
  }

  async setUserData(data: JsonRecord) {
    return await this.fetch({
      body: { data },
      path: "setuserdata",
    });
  }

  // --- Leaderboards & scores ---

  async getRankFromScore(score: number, data: JsonRecord = {}) {
    return await this.fetch({
      body: { data: { score, ...data } },
      path: "getrankfromscore",
    });
  }

  async getBestScores(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "getbestscores",
    });
  }

  async getBetterHighscore(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "getbetterhighscore",
    });
  }

  async getHighscoreBlob(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "gethighscoreblob",
    });
  }

  async setHighscore(data: JsonRecord) {
    return await this.fetch({
      body: { data },
      path: "sethighscore",
    });
  }

  async getLeaderboardPage(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "getleaderboardpage",
    });
  }

  async getFollowingLeaderboard(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "getfollowingleaderboard",
    });
  }

  // --- Levels ---

  async downloadLevel(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "downloadlevel",
    });
  }

  // --- Jam ---

  async getJamRound(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "jam/getround",
    });
  }

  async updateJamRoundStats(data: JsonRecord) {
    return await this.fetch({
      body: { data },
      path: "jam/updateroundstats",
    });
  }

  // --- Notifications ---

  async getNotificationSettings() {
    return await this.fetch({
      path: "getnotificationsettings",
    });
  }

  async setNotificationSettings(data: JsonRecord) {
    return await this.fetch({
      body: { data },
      path: "setnotificationsettings",
    });
  }

  async setNotificationFrequency(data: JsonRecord) {
    return await this.fetch({
      body: { data },
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

  async getPvpChallenges() {
    return await this.fetch({
      path: "pvp/getchallenges",
    });
  }

  async getPvpChallengeResults(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/getchallengeresults",
    });
  }

  async getPvpChallengeUserSettings() {
    return await this.fetch({
      path: "pvp/getchallengeusersettings",
    });
  }

  async setPvpChallengeUserSettings(data: JsonRecord) {
    return await this.fetch({
      body: { data },
      path: "pvp/setchallengeusersettings",
    });
  }

  async claimPvpReward(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/claimreward",
    });
  }

  async continuePvpChallenge(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/continuechallenge",
    });
  }

  async deletePvpChallenge(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/deletechallenge",
    });
  }

  async finishPvpChallenge(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/finishchallenge",
    });
  }

  async pokePvpChallenge(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/pokechallenge",
    });
  }

  async updatePvpChallenge(data: JsonRecord = {}) {
    return await this.fetch({
      body: { data },
      path: "pvp/updatechallenge",
    });
  }
}

export default Base;
