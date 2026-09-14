# <img src="https://static.wixstatic.com/media/4ca2e0_e56b8dab190b47f9b03f93f1af77d034~mv2.png" alt="" height="36" valign="middle"> turborilla-api

An unofficial, typed API wrapper for [Turborilla](https://turborilla.com)'s games. It talks to the same backend and assets CDN the mobile apps use and exposes promise-based clients per game.

Supported games:

- **MX2** — [Mad Skills Motocross 2](https://www.turborilla.com/mad-skills-motocross-2) (`madskillsmotocross2`)
- **MX3** — [Mad Skills Motocross 3](https://www.turborilla.com/mad-skills-motocross-3) (`madskillsmotocross3` - untested)
- **BMX2** — [Mad Skills BMX 2](https://www.turborilla.com/mad-skills-bmx-2) (`bmx2`)

> [!warning]
> This project is not affiliated with or endorsed by Turborilla. It relies on undocumented endpoints that may change or break at any time. Use responsibly.

## Installation

```bash
bun add turborilla
```
> [!note]
> The package ships as ESM only and uses the runtime's native global `fetch` (Node.js 18+, Bun, or any modern runtime). Logging is optional and goes through [`@padosoft/logger`](https://www.npmjs.com/package/@padosoft/logger) (an optional peer dependency).

## Usage

There are two ways in: classes, or a ready-made object of stateless clients.

```ts
import { MX2, BMX2 } from "turborilla";
import turborilla from "turborilla";

// Public endpoints need no credentials at all.
const serverTime = await turborilla.mx2.getServerTime();
const avatar = await turborilla.mx2.getUserAvatar({ userId: "some-user-id" });

// A bound client carries its credentials on every request.
const mx2 = new MX2({
  credentials: { userId: "your-user-id", password: "your-password" },
});
const scores = await mx2.getBestScores({ boardIds: ["board-id"] });
const profile = await mx2.getUserData({
  sections: ["privateProfile", "dailyDash"],
});
```

Each game is also reachable through a subpath, which skips the package index entirely:

```ts
import { MX2 } from "turborilla/mx2";
import { BMX2 } from "turborilla/bmx2";
import { Assets } from "turborilla/assets";
```

### Bound and unbound clients

Every endpoint is either **public** or **user**:

- Public endpoints (`getServerTime`, `getCurrentEvent`, `getUserAvatar`, `getUserData`, `getLeaderboardPage`, ...) never require credentials. When the client has some, they are forwarded, which is how `getUserData` reaches private sections.
- User endpoints (`getBestScores`, `setFollowing`, everything under `pvp/`, ...) require credentials.

Where those credentials come from is encoded in the type of the client:

```ts
// Bound: credentials given once, user endpoints take only their own params.
const bound = new MX2({ credentials: { userId, password } });
await bound.getPvpBadges();
await bound.getBestScores({ boardIds: ["b1"] });

// Unbound: one shared instance, credentials per call (typical server side).
const shared = new MX2();
await shared.getServerTime(); //                                  ✅ public
await shared.getBestScores({ boardIds: ["b1"], credentials }); // ✅ user, credentials given
await shared.getBestScores({ boardIds: ["b1"] }); //              ❌ type error

// A bound client can still override its credentials for one call.
await bound.getBestScores({ boardIds: ["b1"], credentials: otherCredentials });
```

The default export `turborilla` is an object of unbound clients (`turborilla.mx2`, `turborilla.mx3`, `turborilla.bmx2`).

### Calling conventions

- Every method takes **one params object** (optional when nothing in it is required).
- The object may also carry `credentials` and an [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal) as `signal`; both are stripped before the payload is sent.
- Methods return the parsed response: the documented fields are typed, and anything the API returns beyond that is reachable with bracket access as `unknown`.

```ts
const response = await bound.getPvpChallenges({
  status: "active",
  signal: controller.signal,
});
response.serverTime; //         number
response["challenges"]; //      unknown — narrow it yourself
```

### Errors

Every failure rejects with a `TurborillaError`. Branch on `code`:

| Code | Meaning |
| --- | --- |
| `API_ERROR` | The backend answered with a `result` other than `SUCCESS` or with an `errorMessage` (both exposed on the error). |
| `HTTP_ERROR` | Non-2xx status (`status` is set). Also used by the assets client, e.g. a 404 for an unknown skin. |
| `INVALID_JSON` | The body was not JSON or not an object. |
| `MISSING_CREDENTIALS` | A user endpoint was called on an unbound client without `credentials`. |

```ts
import { TurborillaError } from "turborilla";

try {
  await mx2.getBestScores({ boardIds: ["b1"] });
} catch (error) {
  if (error instanceof TurborillaError && error.code === "API_ERROR") {
    console.error(error.result, error.errorMessage);
  }
}
```

### Client options

| Option | Type | Description |
| --- | --- | --- |
| `credentials` | `{ userId: string; password?: string }` | Bind credentials to every request. Omit for an unbound client. |
| `fetch` | `typeof fetch` | Inject a `fetch` implementation (tests, proxies, custom agents). Defaults to the global one, resolved at call time. |
| `logger` | `Logger` | A `@padosoft/logger` instance. Requests are logged at `debug`, failures at `error`. |
| `baseUrl` | `string` | Backend base URL. |
| `assetsBaseUrl` | `string` | Assets CDN base URL. |
| `flagsBaseUrl` | `string` | Base URL for country flags (served from the backend, not the CDN). |
| `headers` | `Record<string, string>` | Extra or overriding request headers. |
| `envelope` | `EnvelopeOverrides` | Override `gameVersion`, `platform`, `language`, ... or add top-level envelope fields. |

```ts
import { Logger } from "@padosoft/logger";
import { consoleTransport } from "@padosoft/logger/transports/console";

const mx2 = new MX2({
  logger: new Logger({ level: "debug", transports: [consoleTransport()] }),
});
```

## API

`MX2`, `MX3` and `BMX2` extend a shared `TurborillaClient` and inherit these methods. Access is **public** unless marked _user_.

Server & events:

- `getServerTime()` — resolves to the server time (number).
- `getCurrentEvent()`, `getCurrentGameEvents()`, `getCurrentJamRound()`, `getJamRound({ roundId })`.

Users & social:

- `isUsernameAvailable({ username, suggestAlternatives? })`, `getUser({ username } | { userId })`, `getUserAvatar({ userId })`. `getUser` resolves to a typed summary (`userId`, `username`, `firstName`, `name`, `banned`, `level`, `paragon`, `experienceProgress`, `following`, `followers`, `hasCountedFollowing`, `hasCountedFollowers`, `jamAttempts`, `jamStarStreak`, `jamLongestStarStreak`, `jamWorldPlayerRanking`).
- `isConnected({ appleId?, facebookId?, email?, ... })` — check whether an identity provider id is already linked to an account (unset ids are sent as `null`). `loginApple({ appleId, email, timeZone })` — Sign in with Apple.
- `getUserData({ sections, keys?, userId? })` — `sections` is a typed list of section names (`publicProfile`, `privateProfile`, `achievementSystem`, `payments`, plus per-game ones such as MX2's `dailyDash`, `divisionPro`, ... and BMX2's `turboVariables`, `gameProgress`, `premiumTracks`, `storeInfo`, `trackPacks`, `jamDivision`). `keys` passes raw backend keys the wrapper does not know. Omit `userId` to read yourself (authenticated; private sections need credentials); pass `userId` to read another user, which is sent as a guest with the id inside `data` and returns public sections only.
- _user_ `isFollowing({ userIds })`, `isFollowingMe({ userIds })`, `setFollowing({ userIds })`, `setUnfollowed({ userId })`, `getFollowing({ pageSize, cursor? })`.
- _user_ `setUserData({ data, isPublic?, wallet?, level?, ownerId?, gameVersionNumber? })` (`data` maps section wire-names to JSON-encoded strings, `isPublic` to visibility flags; the rest upload the wallet snapshot and session metadata). `setUserDataSession({ ownerId, lastTimestamp, gameVersionNumber })` opens the write session before an upload.

Leaderboards & scores:

- `getLeaderboardPage({ boardId, pageSize, cursor? })`, `getHighscoreBlob({ boardId, userId })`, `getHighscoreAtScore({ boardId, referenceScore })` (the highscore ranked at a given score), `getHighscores({ boardIds, userId? })` (a user's scores across boards; pass `userId` to read anyone as a guest, omit it for the authenticated caller).
- _user_ `getRankFromScore({ boardIds, scores?, preciseRankLimit?, lightweight? })`, `getBestScores({ boardIds })`, `getBetterHighscore({ boardId, referenceScore? })`, `setHighscore({ ... })`, `getFollowingLeaderboard({ boardId })`.

Levels & jam:

- `downloadLevel({ levelId })`.
- _user_ `updateJamRoundStats({ roundId, attemptsSinceLastUpdate, defeatedPlayersSinceLastUpdate })`.

Notifications (_user_):

- `getNotificationSettings()`, `setNotificationSettings({ ... })`, `setNotificationFrequency({ frequency })`.

PvP:

- `getPvpLevels()`.
- _user_ `getPvpBadges()`, `clearPvpBadges()`, `getPvpChallenges({ status?, cursor?, pageSize? })`, `getPvpChallengeResults({ challengeId })`, `getPvpChallengeUserSettings()`, `setPvpChallengeUserSettings({ isTauntEnabled })`, `claimPvpReward({ rewardId })`, `continuePvpChallenge({ previousChallengeId, level, timeStart })`, `deletePvpChallenge({ challengeId })`, `finishPvpChallenge({ challengeId, pairingNumber, secondaryPairingNumber })`, `pokePvpChallenge({ challengeId })`, `updatePvpChallenge({ ... })`.

Game-specific:

- **BMX2** — `getGameConfig()` returns the remote config (`enabled`, `resources`) with a plain GET.

> Request payloads were modelled from captured production traffic; the exported `*Params` interfaces document the exact field types. `getHighscoreBlob` is classified public by its semantics but was only observed while logged in; please open an issue if the backend rejects it as a guest.

### Assets

`client.assets` (also exported standalone as `Assets`) wraps the public CDN the game loads downloadable content from, plus the country flags the backend serves. Each game points its assets client at its own CDN (BMX2 and MX3 differ from MX2); a `assetsBaseUrl` option still overrides it. Nothing here needs credentials.

```ts
const { assets } = turborilla.mx2;

const manifest = await assets.getSkinsManifest(); //        { versions: { bike100193: 4, ... } }
const zip = await assets.downloadSkin({ skinId: "bike100193" }); // ArrayBuffer (application/zip)
const strings = await assets.getLanguage({ language: "EN" }); //  { entries: { EXAMPLE: "...", ... } }

// BMX2 exposes the track-pack manifest on its own CDN.
const packs = await turborilla.bmx2.assets.getTrackPacksManifest(); // { trackPacks: [{ packId, name, tracks }] }

const flag = await assets.downloadFlag({ code: "AR" }); //       ArrayBuffer (image/png, 250px)

const season = await assets.getDailyDashSeason({ year: 2026, month: 9 }); // prizes for the month
const day = await assets.getDailyDashDay({ year: 2026, month: 9, day: 13 }); // track metadata
const track = await assets.downloadDailyDashTrack({
  year: 2026,
  month: 9,
  day: 13,
}); // .trk bytes
const replay = await assets.downloadDailyDashReplay({
  year: 2026,
  month: 9,
  day: 13,
  index: 1,
});

assets.skinUrl({ skinId: "bike100193" }); // every download has a matching *Url builder
```

### Extending

Games are plain data. To add an endpoint or a game, subclass the client and use the protected helpers:

```ts
import { MX2, type CallArgs, type Credentials } from "turborilla";

class MyMX2<
  TCredentials extends Credentials | undefined = undefined,
> extends MX2<TCredentials> {
  getSomething(...args: CallArgs<TCredentials, "user", { thingId: string }>) {
    return this.call<{ thingId: string }, { thing: unknown }>(
      "getsomething",
      "user",
      args
    );
  }
}
```

`call` resolves credentials and posts the payload; `request` sends a raw request (`path`, `method`, `data`, `credentials`, `signal`) and validates the response envelope.

## Migrating from `madskillsmx` 1.x

- `new MX2({ userId, password, debug })` → `new MX2({ credentials: { userId, password }, logger })`. Guest clients no longer need a `userId` at all.
- Positional arguments became params objects: `getUserAvatar("id")` → `getUserAvatar({ userId: "id" })`.
- `getUserData({ privateProfile: true, dailyDash: true })` → `getUserData({ sections: ["privateProfile", "dailyDash"] })`.
- Errors are `TurborillaError` instances with a `code` instead of strings.
- Type names are PascalCase (`GetUserDataParams`, `ApiResponse`, `JsonObject`).

## Development

This repo uses [Bun](https://bun.sh), [tsdown](https://tsdown.dev) for building, and [Ultracite](https://www.ultracite.ai) (Oxlint + Oxfmt) for linting and formatting. Shared TypeScript/tsdown configuration comes from [`@padosoft/config`](https://www.npmjs.com/package/@padosoft/config).

```bash
bun install       # install dependencies
bun test          # run the test suite
bun run typecheck # type-check src, tests (incl. compile-time contracts) and scripts
bun run build     # bundle to dist/ with tsdown
bun run check     # lint + format check
bun run fix       # auto-fix lint + format issues
```

See [AGENTS.md](AGENTS.md) for the project overview and code standards.

### Scripts

The `scripts/` folder holds runnable examples. They read and write captures under `.captures/` (git-ignored), so captured data is never committed.

```bash
# Fetch a user's full profile response (sections decoded under `data`) to
# .captures/<userId>/<game>/user-data.json
bun run scripts/get-user-data.ts <mx2|mx3|bmx2> <userId>

# Re-encode that file and push every section back via setUserData
bun run scripts/update-user-data.ts <mx2|mx3|bmx2> <userId>

# Deeply sort selected sections (natural order) in the capture file, locally
bun run scripts/sort-user-data.ts <mx2|mx3|bmx2> <userId>

# Fetch the daily dash season and the track of the day from the CDN into
# .captures/daily-dash/
bun run scripts/get-daily-dash.ts [year] [month] [day]
```

The profile scripts take the game (`mx2` \| `mx3` \| `bmx2`, or `MADSKILLS_GAME`) and the target userId (argument or `MADSKILLS_USER_ID`), plus `MADSKILLS_PASSWORD` (needed for private sections and required for updates) and `MADSKILLS_INSTALL_ID` (only for wallet uploads). Copy `.env.example` to `.env` and fill these in. Captures are namespaced under `.captures/<userId>/<game>/`. `get-user-data.ts` requests every section the chosen game knows about and saves the whole response (its `data` sections decoded in place); `update-user-data.ts` re-encodes the sections under that file's `data` and uploads them (edit its `PUBLIC_SECTIONS` set to choose which are public).

### Commit conventions

- Always split work into **multiple, atomic commits** — one logical change per commit, each buildable on its own.
- Write commit messages using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).

## License

ISC © PADO
