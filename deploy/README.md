# Harness Bench — deploy (nginx + FastAPI, Docker)

Serves the harness apps and **persists the config to a JSON file on the server**
(no browser-storage limits). Default port **8270**. The apps still work offline as
plain files; they only switch to the server when opened over `http(s)`.

```
deploy/
  docker-compose.yml   harness-bench-web (nginx) + harness-bench-api (FastAPI)
  .env.example         port / data-dir / auth settings  (copy to .env)
  nginx/default.conf   reverse proxy + static serving
  backend/             FastAPI app (app/main.py, auth.py, storage.py, config.py)
  data/                created on first run -> configs/ and backups/  (PERSISTED)
```

## 1. Deploy

```bash
cd deploy
cp .env.example .env            # edit HOST_PORT / DATA_DIR if you want
docker compose up -d --build
```

Open **http://<server-ip>:8270**. The landing page shows a green
“● server connected” when the API is up.

- Containers: **harness-bench-web** and **harness-bench-api**.
- Config file: `${DATA_DIR}/configs/default.json`.
- Backups: a timestamped copy in `${DATA_DIR}/backups/default/` on every save (last 50).

### Persist data to a specific server folder
Set `DATA_DIR` in `.env` to an absolute path, e.g.:

```
HOST_PORT=8270
DATA_DIR=/srv/harness-bench/data
```

Create it first: `sudo mkdir -p /srv/harness-bench/data`. That folder is the
single source of truth — **back it up** and your whole bench config is safe.

Common ops:
```bash
docker compose ps                 # status/health
docker compose logs -f api        # backend logs
docker compose down               # stop (data stays in DATA_DIR)
docker compose up -d --build      # update after editing backend code
```
(After editing the HTML/JS apps, just refresh the browser — no rebuild needed.)

### Run without Docker (dev)
```bash
cd deploy/backend && pip install -r requirements.txt
HARNESS_DATA_DIR=../data uvicorn app.main:app --port 8000
# serve the project folder statically and proxy /api -> :8000
```

## 2. PRESERVE YOUR EXISTING DATA  ← do this once

Your current work is in the browser’s local storage **for the `file://` origin**,
which the browser keeps separate from `http://`, so it won’t carry over by itself:

1. Open your **current** Harness Builder (local file) → **📤 Export JSON**, save it.
2. Start the server, open the served **Harness Builder** at `http://<server>:8270`.
3. **📥 Import JSON** → pick that file. It saves straight to the server.

Equivalent: drop your exported file at `${DATA_DIR}/configs/default.json` before the
first `docker compose up`.

## 3. Multiple benches / configs

Keyed by config name (default `default`). Open any app with `?config=NAME`
(e.g. `Harness Builder.html?config=truck2`) for a separate saved config.
`GET /api/configs` lists them.

## 4. Turn on authentication later (no rewrite)

- **Quick gate:** uncomment `auth_basic` in `nginx/default.conf` + add `.htpasswd`.
- **Real RBAC:** set `AUTH_DISABLED=false` in `.env`, implement `_user_from_token()`
  in `backend/app/auth.py` (validate JWT, load user, map roles), optionally add a
  `/api/auth/login` route. Endpoints already enforce `require_perm(...)`; the
  frontend already sends an `Authorization` header via `hcAuthHeaders()` in
  `harness_config.js` (return `{Authorization:"Bearer "+token}` once you have login).

## API summary

| Method | Path | Perm | Notes |
|---|---|---|---|
| GET | `/api/health` | — | status |
| GET | `/api/configs` | read | list names |
| GET | `/api/configs/{name}` | read | `{config, rev}` + `ETag` |
| PUT | `/api/configs/{name}` | write | body `{config, rev}`; `409` on stale `rev` |
| GET | `/api/configs/{name}/versions` | read | backup timestamps |
| POST | `/api/configs/{name}/restore/{ts}` | write | restore a backup |

## Notes
- **Concurrency:** ETag/revision; stale write → `409`, app shows “conflict — reload”.
- **Images:** embedded (compressed) in the JSON today; can move to file uploads later.
- **Security:** `/deploy/` and dotfiles are blocked from http; put TLS/basic-auth at
  nginx or a fronting proxy for internet exposure.
