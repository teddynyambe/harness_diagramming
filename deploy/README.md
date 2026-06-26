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

## 0. Server prerequisites (one-time)

On the server you need Docker + the Compose plugin, and your user must be able to
talk to the Docker daemon **without sudo**, or `docker compose` fails with
`permission denied … /var/run/docker.sock`:

```bash
sudo usermod -aG docker $USER     # add yourself to the docker group
exit                              # log out/in so the new group applies
docker compose version            # verify it works without sudo
```

(The `docker` group is effectively root — standard for a dev/bench host. If that's
not allowed, run the compose commands with `sudo` and add a NOPASSWD sudoers entry
so non-interactive SSH deploys don't hang on a password.)

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

## 1b. Ongoing updates — `deploy.sh` (CODE and DATA are separate)

The repo root has `deploy.sh`. **Golden rule: deploy code with git; never push your
local data folder over production.** The app owns `DATA_DIR` (it writes config +
backups at runtime); a blind `rsync --delete` of that folder wipes live edits.

```bash
chmod +x deploy.sh                       # once

./deploy.sh deploy  "what changed"       # code only: commit+push, server git pull + rebuild
./deploy.sh publish "what changed"       # code + DATA: also push local configs -> production (dev)
./deploy.sh backup                       # copy production data -> local (SAFE direction)
./deploy.sh seed export.json [name]      # load ONE config onto production (default: 'default')
```

### Dev workflow vs. launched

- **While developing** (local is the source of truth): edit locally, then
  `./deploy.sh publish "msg"` to push **code + data** together. For `publish` to
  carry your data, your local edits must land in files at `LOCAL_DATA/configs/*.json`
  — i.e. **run the app locally through the server** (see below), not as `file://`.
  `publish` snapshots prod configs first and never deletes prod backups.
- **After launch** (production is the source of truth): use `./deploy.sh deploy "msg"`
  for code only and edit data in the production web app (it auto-saves). **Stop using
  `publish`/`seed`** then, or you'll overwrite live production edits.

Run the app locally so edits persist to files (enables `publish`):
```bash
cd deploy
cp .env.example .env       # set DATA_DIR=/Users/<you>/code/data/harnes-bench (= LOCAL_DATA), HOST_PORT=8270
docker compose up -d --build
# edit at http://localhost:8270  -> saves to LOCAL_DATA/configs/default.json
```
Set `LOCAL_DATA` in `deploy.sh` to that same folder.

Set the variables at the top of `deploy.sh` first: `SERVER`, `REMOTE_REPO`
(the git checkout on the server that contains `deploy/`), `REMOTE_DATA`
(= `DATA_DIR`), `LOCAL_BACKUP`. Requires Docker permissions from **§0** and SSH
access to the server.

Everyday loop: `./deploy.sh deploy "…"` for code; `./deploy.sh backup` for safety
copies. Move data only via **Import/Export JSON** in the web UI or `./deploy.sh seed`.

> First run gotcha: a fresh production server has no `configs/default.json`, so the
> first browser to open it **seeds** the file (from the bundled example on a clean
> browser). That's why a new server can show the example. Load your real data once
> (Import JSON or `seed`) and it won't come back — seeding only happens when the
> file is missing.

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
