import os
import tomllib
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]


def load_config() -> dict:
    with open(BACKEND_DIR / "config.toml", "rb") as file:
        return tomllib.load(file)


def load_ors_api_key() -> str | None:
    load_dotenv(BACKEND_DIR / ".env")
    return os.getenv("ORS_API_KEY") or None
