# config.py

import os
from dotenv import load_dotenv

load_dotenv()


# -------------------------
# RabbitMQ
# -------------------------

RABBITMQ_HOST = os.getenv(
    "RABBITMQ_HOST",
    "localhost"
)

RABBITMQ_PORT = int(
    os.getenv("RABBITMQ_PORT", "5672")
)

RABBITMQ_USER = os.getenv(
    "RABBITMQ_USER",
    "guest"
)

RABBITMQ_PASSWORD = os.getenv(
    "RABBITMQ_PASSWORD",
    "guest"
)

RABBITMQ_QUEUE = os.getenv(
    "RABBITMQ_QUEUE",
    "music-upload"
)


# -------------------------
# .NET API
# -------------------------

API_BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://localhost:5000"
)

API_INTERNAL_KEY = os.getenv(
    "API_INTERNAL_KEY",
    ""
)


# -------------------------
# Google Drive
# -------------------------

GOOGLE_APPLICATION_CREDENTIALS = os.getenv(
    "GOOGLE_APPLICATION_CREDENTIALS"
)

GOOGLE_DRIVE_FOLDER_ID = os.getenv(
    "GOOGLE_DRIVE_FOLDER_ID"
)


# -------------------------
# Music processing
# -------------------------

DOWNLOAD_DIRECTORY = os.getenv(
    "DOWNLOAD_DIRECTORY",
    "./tmp/youtube_downloads"
)


from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_username: str = "guest"
    rabbitmq_password: str = "guest"
    rabbitmq_vhost: str = "/"

    work_queue: str = "music.work"
    completed_queue: str = "music.work.completed"

    max_concurrency: int = 10

    class Config:
        env_prefix = ""


settings = Settings()