# turborilla

An unofficial, typed API wrapper for [Turborilla](https://turborilla.com)'s games. It talks to the same backend and assets CDN the mobile apps use and exposes promise-based clients per game.

Supported games:

- **MX2** — Mad Skills Motocross 2 (`madskillsmotocross2`)
- **BMX2** — Mad Skills BMX 2 (`bmx2`)

> ⚠️ This project is not affiliated with or endorsed by Turborilla. It relies on undocumented endpoints that may change or break at any time. Use responsibly.

## Installation

```bash
bun add turborilla
```

```bash
npm install turborilla
```

The package ships as ESM only and uses the runtime's native global `fetch` (Node.js 18+, Bun, or any modern runtime). Logging is optional and goes through [`@padosoft/logger`](https://www.npmjs.com/package/@padosoft/logger) (an optional peer dependency).

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

The default export `turborilla` is an object of unbound clients (`turborilla.mx2`, `turborilla.bmx2`).

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

`MX2` and `BMX2` extend a shared `TurborillaClient` and inherit these methods. Access is **public** unless marked _user_.

Server & events:

- `getServerTime()` — resolves to the server time (number).
- `getCurrentEvent()`, `getCurrentGameEvents()`, `getCurrentJamRound()`, `getJamRound({ roundId })`.

Users & social:

- `isUsernameAvailable({ username, suggestAlternatives? })`, `getUser({ username } | { userId })`, `getUserAvatar({ userId })`.
- `getUserData({ sections, keys?, userId? })` — `sections` is a typed list of section names (`publicProfile`, `privateProfile`, `achievementSystem`, `payments`, plus per-game ones such as MX2's `dailyDash`, `trackPacks`, `divisionPro`, ...). `keys` passes raw backend keys the wrapper does not know. `userId` reads another user and is sent at the envelope top level. Private sections need credentials.
- _user_ `isFollowing({ userIds })`, `isFollowingMe({ userIds })`, `setFollowing({ userIds })`, `setUnfollowed({ userId })`, `setUserData({ data, isPublic? })` (`data` maps section wire-names to JSON-encoded strings, `isPublic` to visibility flags).

Leaderboards & scores:

- `getLeaderboardPage({ boardId, pageSize, cursor? })`, `getHighscoreBlob({ boardId, userId })`.
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

`client.assets` (also exported standalone as `Assets`) wraps the public CDN the game loads downloadable content from. Nothing here needs credentials.

```ts
const { assets } = turborilla.mx2;

const manifest = await assets.getSkinsManifest(); //        { versions: { bike100193: 4, ... } }
const zip = await assets.downloadSkin({ skinId: "bike100193" }); // ArrayBuffer (application/zip)
const strings = await assets.getLanguage({ language: "EN" }); //  { entries: { EXAMPLE: "...", ... } }

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
# Fetch the profile sections of a user and save them (decoded) to
# .captures/<userId>/user-data.json
bun run scripts/get-user-data.ts <userId>

# Re-encode that file and push every section back via setUserData
bun run scripts/update-user-data.ts <userId>

# Deeply sort selected sections (natural order) in the capture file, locally
bun run scripts/sort-user-data.ts <userId>

# Fetch the daily dash season and the track of the day from the CDN into
# .captures/daily-dash/
bun run scripts/get-daily-dash.ts [year] [month] [day]
```

The profile scripts read the target userId from the argument or the `MADSKILLS_USER_ID` env var, plus `MADSKILLS_PASSWORD` (needed for private sections and required for updates). `update-user-data.ts` uploads all sections in the capture file; edit its `PUBLIC_SECTIONS` set to choose which are public.

### Commit conventions

- Always split work into **multiple, atomic commits** — one logical change per commit, each buildable on its own.
- Write commit messages using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).

## License

ISC © PADO
