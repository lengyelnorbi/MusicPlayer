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