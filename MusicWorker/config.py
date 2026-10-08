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


RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USERNAME = os.getenv("RABBITMQ_USERNAME", "guest")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

WORK_QUEUE = os.getenv("RABBITMQ_WORK_QUEUE", "music.work")
COMPLETED_QUEUE = os.getenv(
    "RABBITMQ_COMPLETED_QUEUE", "music.work.completed"
)

MUSIC_TEMP_PATH = Path(os.getenv("MUSIC_TEMP_PATH", "/music-temp")).resolve()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
ALLOWED_SOURCE_DOMAINS = _csv_env("ALLOWED_SOURCE_DOMAINS")
