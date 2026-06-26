"""Pluggable authentication / authorization.

Designed so real auth (JWT/OAuth2, a user store, etc.) can be added later
WITHOUT touching the route handlers: they only depend on `require_perm(...)`.

Today `settings.auth_disabled = True` => every request is treated as a local
admin. To turn auth on:
  1. set HARNESS_AUTH_DISABLED=false
  2. implement `_user_from_token()` (validate a JWT, look the user up, map roles)
  3. (optionally) add a /api/auth/login route that issues tokens
The permission model (role -> permissions) below already gates the endpoints.
"""
from dataclasses import dataclass, field
from typing import List, Set, Optional
from fastapi import Depends, Header, HTTPException

from .config import settings

# role -> permissions. Extend freely (e.g. per-config scopes later).
ROLE_PERMS = {
    "viewer": {"config:read"},
    "editor": {"config:read", "config:write"},
    "admin":  {"config:read", "config:write", "config:admin"},
}
ALL_PERMS: Set[str] = set().union(*ROLE_PERMS.values())


@dataclass
class User:
    username: str
    roles: List[str] = field(default_factory=list)
    perms: Set[str] = field(default_factory=set)


def perms_for(roles: List[str]) -> Set[str]:
    out: Set[str] = set()
    for r in roles:
        out |= ROLE_PERMS.get(r, set())
    return out


def _user_from_token(token: str) -> Optional[User]:
    """TODO: validate the token (JWT signature/expiry), load the user and roles.
    Returning None => 401. This is the single place to plug a real IdP."""
    return None


def get_current_user(authorization: Optional[str] = Header(default=None)) -> User:
    if settings.auth_disabled:
        return User(username="local", roles=["admin"], perms=set(ALL_PERMS))
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user = _user_from_token(authorization.split(" ", 1)[1])
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def require_perm(perm: str):
    """Dependency factory: protect a route with a required permission."""
    def _dep(user: User = Depends(get_current_user)) -> User:
        if perm not in user.perms:
            raise HTTPException(status_code=403, detail=f"Missing permission: {perm}")
        return user
    return _dep
