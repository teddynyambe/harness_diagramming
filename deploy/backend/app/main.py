"""Harness Config API (FastAPI).

Routes are thin; auth is enforced via the `require_perm(...)` dependency so that
turning on real authentication later requires no changes here.
"""
from typing import Optional, Any, Dict
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .auth import require_perm, User
from . import storage

app = FastAPI(title="Harness Config API", version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "version": settings.version, "auth_disabled": settings.auth_disabled}


@app.get("/api/configs")
def list_configs(user: User = Depends(require_perm("config:read"))):
    return {"configs": storage.list_configs()}


@app.get("/api/configs/{name}")
def get_config(name: str, user: User = Depends(require_perm("config:read"))):
    try:
        data = storage.load(name)
    except ValueError:
        raise HTTPException(400, "invalid config name")
    if data is None:
        raise HTTPException(404, "config not found")
    return JSONResponse({"config": data["config"], "rev": data["rev"]},
                        headers={"ETag": data["rev"]})


@app.put("/api/configs/{name}")
async def put_config(
    name: str,
    request: Request,
    user: User = Depends(require_perm("config:write")),
    if_match: Optional[str] = Header(default=None),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "invalid JSON body")
    config = body.get("config", body) if isinstance(body, dict) else body
    rev = (body.get("rev") if isinstance(body, dict) else None) or if_match
    try:
        new_rev = storage.save(name, config, expected_rev=rev)
    except ValueError:
        raise HTTPException(400, "invalid config name")
    except storage.Conflict as c:
        raise HTTPException(409, detail={"error": "version_conflict", "current_rev": c.current})
    return JSONResponse({"ok": True, "rev": new_rev}, headers={"ETag": new_rev})


@app.get("/api/configs/{name}/versions")
def versions(name: str, user: User = Depends(require_perm("config:read"))):
    try:
        return {"versions": storage.list_versions(name)}
    except ValueError:
        raise HTTPException(400, "invalid config name")


@app.post("/api/configs/{name}/restore/{ts}")
def restore(name: str, ts: str, user: User = Depends(require_perm("config:write"))):
    try:
        rev = storage.restore(name, ts)
    except ValueError:
        raise HTTPException(400, "invalid name")
    except FileNotFoundError:
        raise HTTPException(404, "version not found")
    return {"ok": True, "rev": rev}
