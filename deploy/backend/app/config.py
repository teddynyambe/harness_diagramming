"""Runtime settings (override via HARNESS_* environment variables)."""
from typing import List
try:
    from pydantic_settings import BaseSettings
except Exception:  # pragma: no cover - fallback if pydantic-settings missing
    from pydantic import BaseSettings  # type: ignore


class Settings(BaseSettings):
    # where config JSON + backups live (a mounted volume in production)
    data_dir: str = "/data"
    # how many timestamped backups to keep per config
    max_backups: int = 50
    # AUTH: leave True until you wire real auth; flip to False to enforce tokens
    auth_disabled: bool = True
    # allowed CORS origins (same-origin via nginx => "*" is fine for a LAN tool)
    cors_origins: List[str] = ["*"]
    # max upload size hint (bytes) for the optional image endpoint
    max_upload_bytes: int = 25 * 1024 * 1024
    version: str = "1.0.0"

    class Config:
        env_prefix = "HARNESS_"


settings = Settings()
