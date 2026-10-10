import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _csv_env(name: str) -> set[str]:
    return {
        value.strip().lower().lstrip(".")
        for value in os.getenv(name, "").split(",")
        if value.strip()
    }


def _list_env(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USERNAME = os.getenv("RABBITMQ_USERNAME", "guest")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

WORK_QUEUE = os.getenv("RABBITMQ_WORK_QUEUE", "music.work")
SINGLE_WORK_QUEUE = os.getenv("RABBITMQ_SINGLE_WORK_QUEUE", "music.work.single")
COMPLETED_QUEUE = os.getenv(
    "RABBITMQ_COMPLETED_QUEUE", "music.work.completed"
)
CONTROL_QUEUE = os.getenv("RABBITMQ_CONTROL_QUEUE", "music.work.control")

MUSIC_TEMP_PATH = Path(os.getenv("MUSIC_TEMP_PATH", "/app/music-temp")).resolve()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
ALLOWED_SOURCE_DOMAINS = _csv_env("ALLOWED_SOURCE_DOMAINS")
# Use full proxy URLs, for example:
# PROXY_URLS=http://proxy-a:8080,http://user:password@proxy-b:8080
PROXY_URLS = _list_env("PROXY_URLS")
PROXY_ATTEMPTS = max(1, int(os.getenv("PROXY_ATTEMPTS", str(len(PROXY_URLS) or 1))))
