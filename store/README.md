# store/

Saves a finished game as a public-safe replay and serves it back for the share link and the leaderboard. Replays live in Akamai Object Storage, or in local files when no keys are set.

## Routes

All answers are JSON with `cache-control: no-store`. Types are in `replay.ts`.

| Route | Answer |
|---|---|
| `POST /api/replays` with `{ state, refereeLog?, classCode?, playerName? }` | `200 { id, shareUrl, score }`. `shareUrl` is `null` when storage is down. `400 { error }` for a bad shape or a game that is not over, `413` over 1 MB, `429` over 60 saves a minute, `405` wrong method. |
| `GET /api/replays/:id` | `200 { replay, source }`. `404` unknown id, `502` storage unavailable. |
| `GET /api/leaderboard` | `200 { entries, source }`: top 10, best score first, cached 10 s. Empty when storage is down. |

`source` is `"object-storage"` or `"local"`. The share link is `<origin>/?replay=<id>`; ids are 12 hex characters.

The server never trusts the browser: `toReplay()` copies whitelisted fields only, caps every string, drops DMs and the player's own posts, and recomputes the score with `radar()`.

## Environment

| Name | Workshop alias | Required | Meaning |
|---|---|---|---|
| `S3_ENDPOINT` | `OBJ_ENDPOINT` | yes | `https://us-ord-10.linodeobjects.com` |
| `S3_BUCKET` | `OBJ_BUCKET` | yes | bucket name |
| `S3_ACCESS_KEY` | `OBJ_ACCESS_KEY` | yes | access key |
| `S3_SECRET_KEY` | `OBJ_SECRET_KEY` | yes | secret key |
| `S3_REGION` | | no | signing region, default `us-east-1` |
| `PUBLIC_APP_URL` | | no | base of the share link; default is the request's own origin |
| `STORE_DIR` | | no | folder for the local fallback, default `store/.data` |

Object Storage is used only when all four required names are set. Otherwise replays are written to local files, which is what dev and the tests use. The server logs which one it picked at the first request.

## Bucket

Create the bucket in Chicago (endpoint `https://us-ord-10.linodeobjects.com`). Create an access key limited to that bucket, with read and write. Keep the bucket private: the server reads the objects and no ACL is ever set.

| Key | Content |
|---|---|
| `replays/<id>.json` | one `Replay` |
| `scores/<10000 - score, 5 digits>-<time in ms, 14 digits>-<id>.json` | one `LeaderboardEntry` |

Listing `scores/` in key order is the leaderboard: best score first, the earlier game wins a tie. Every save writes new keys, so two saves at once cannot overwrite each other.

## Mounting

In `server/index.ts`, before the `/api/` 404 branch:

```ts
import { handleStore } from '../store/handler.ts';
if (await handleStore(req, res)) return;
```

For `/api/health`: `storageHealth()` from the same file answers `'up'` or `'down'`.

The `db/` lane gets every saved game by setting the hook once at startup:

```ts
import { hooks } from '../store/handler.ts';
hooks.saveGame = saveGame; // (g: SavedGame) => Promise<unknown>; a throw is logged and does not fail the save
```

`SavedGame.state` is the browser's state after a shape check, not a cleaned copy: use query parameters and cap what you store.
