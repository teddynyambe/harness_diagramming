"""File-backed config storage: atomic writes, timestamped backups, and
optimistic-concurrency (revision = short hash of the stored bytes).

Layout under DATA_DIR:
  configs/<name>.json            current config
  backups/<name>/<ts>.json       rolling backups (max_backups kept)
  uploads/<name>/<file>          optional image files
"""
import os
import re
import json
import time
import glob
import hashlib
import threading
from typing import Optional, List, Dict, Any

from .config import settings

_LOCK = threading.Lock()
_NAME_RE = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")


class Conflict(Exception):
    def __init__(self, current_rev: str):
        super().__init__("version conflict")
        self.current = current_rev


def _safe(name: str) -> str:
    if not _NAME_RE.match(name or ""):
        raise ValueError("invalid config name")
    return name


def _rev(raw: str) -> str:
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


def _cfg_path(name: str) -> str:
    base = os.path.join(settings.data_dir, "configs")
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, f"{name}.json")


def _backup_dir(name: str) -> str:
    d = os.path.join(settings.data_dir, "backups", name)
    os.makedirs(d, exist_ok=True)
    return d


def load(name: str) -> Optional[Dict[str, Any]]:
    name = _safe(name)
    p = _cfg_path(name)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        raw = f.read()
    return {"config": json.loads(raw), "rev": _rev(raw)}


def save(name: str, config: Any, expected_rev: Optional[str] = None) -> str:
    name = _safe(name)
    with _LOCK:
        p = _cfg_path(name)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                cur = f.read()
            cur_rev = _rev(cur)
            # optimistic concurrency: only enforce when caller supplied a rev
            if expected_rev not in (None, "", "*") and expected_rev != cur_rev:
                raise Conflict(cur_rev)
            # backup the previous version, then prune
            ts = time.strftime("%Y%m%d-%H%M%S")
            with open(os.path.join(_backup_dir(name), f"{ts}.json"), "w", encoding="utf-8") as bf:
                bf.write(cur)
            files = sorted(glob.glob(os.path.join(_backup_dir(name), "*.json")))
            for old in files[:-settings.max_backups] if settings.max_backups > 0 else []:
                try:
                    os.remove(old)
                except OSError:
                    pass
        raw = json.dumps(config, ensure_ascii=False, separators=(",", ":"))
        tmp = p + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(raw)
        os.replace(tmp, p)  # atomic on same filesystem
        return _rev(raw)


def list_configs() -> List[str]:
    base = os.path.join(settings.data_dir, "configs")
    if not os.path.isdir(base):
        return []
    return sorted(os.path.splitext(os.path.basename(x))[0]
                  for x in glob.glob(os.path.join(base, "*.json")))


def list_versions(name: str) -> List[str]:
    name = _safe(name)
    d = os.path.join(settings.data_dir, "backups", name)
    if not os.path.isdir(d):
        return []
    return [os.path.splitext(os.path.basename(x))[0]
            for x in sorted(glob.glob(os.path.join(d, "*.json")), reverse=True)]


def restore(name: str, ts: str) -> str:
    name = _safe(name)
    src = os.path.join(settings.data_dir, "backups", name, f"{_safe(ts)}.json")
    if not os.path.exists(src):
        raise FileNotFoundError(ts)
    with open(src, "r", encoding="utf-8") as f:
        raw = f.read()
    return save(name, json.loads(raw))
