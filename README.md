# madskillsmx

An unofficial, typed API wrapper for [Turborilla](https://turborilla.com)'s _Mad Skills_ games. It talks to the same backend the mobile apps use and exposes a small, promise-based client for each supported game.

Supported games:

- **MX2** — Mad Skills Motocross 2 (`madskillsmotocross2`)
- **BMX2** — Mad Skills BMX 2 (`bmx2`)

> ⚠️ This project is not affiliated with or endorsed by Turborilla. It relies on undocumented endpoints that may change or break at any time. Use responsibly.

## Installation

```bash
bun add madskillsmx
```

```bash
npm install madskillsmx
```

The package ships as ESM only and uses the runtime's native global `fetch` (Node.js 18+, Bun, or any modern runtime).

## Usage

```ts
import { MX2, BMX2 } from "madskillsmx";

// A guest client only needs a userId.
const mx2 = new MX2({ userId: "your-user-id", debug: true });

const serverTime = await mx2.getServerTime();
const event = await mx2.getCurrentEvent();

// Authenticated calls also need a password.
const account = new MX2({ userId: "your-user-id", password: "your-password" });
const profile = await account.getUserData({
  privateProfile: true,
  dailyDash: true,
});
```

### Client options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `userId` | `string` | yes | The account/user id to send with every request. |
| `password` | `string` | no | When provided, the client is marked as authenticated. |
| `debug` | `boolean` | no | Logs each request to the console. Defaults to `false`. |

## API

Both `MX2` and `BMX2` extend a shared `Base` client and inherit these methods:

- `getServerTime()` — current server time.
- `getCurrentEvent()` — the active event.
- `getCurrentGameEvents()` — all active game events.
- `getCurrentJamRound()` — the current jam round.
- `isUsernameAvailable(username, suggestAlternatives?)` — availability check.
- `getUser(username)` — public info for a username.
- `getUserData(options)` — fetch profile data sections for a user. Options are boolean flags (`privateProfile`, `publicProfile`, `achievementSystem`, `payments`) plus an optional `userId` override.

Game-specific additions:

- **MX2** — `getUserData` also accepts a `dailyDash` flag.
- **BMX2** — `getGameConfig()` returns the remote game config.

## Development

This repo uses [Bun](https://bun.sh), [tsdown](https://tsdown.dev) for building, and [Ultracite](https://www.ultracite.ai) (Oxlint + Oxfmt) for linting and formatting. Shared TypeScript/tsdown configuration comes from [`@padosoft/config`](https://www.npmjs.com/package/@padosoft/config).

```bash
bun install       # install dependencies
bun run build     # bundle to dist/ with tsdown
bun run typecheck # type-check with tsc
bun run check     # lint + format check
bun run fix       # auto-fix lint + format issues
```

See [AGENTS.md](AGENTS.md) for the project overview and code standards.

## License

ISC © PADO
