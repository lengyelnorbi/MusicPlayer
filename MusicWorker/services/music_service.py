# services/music_service.py

import os
from pathlib import Path

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from pytubefix import YouTube

from config import (
    DOWNLOAD_DIRECTORY,
    GOOGLE_DRIVE_FOLDER_ID
)


SCOPES = [
    "https://www.googleapis.com/auth/drive"
]


class MusicService:

    def __init__(self):
        os.makedirs(
            DOWNLOAD_DIRECTORY,
            exist_ok=True
        )

        self.drive_service = self._create_drive_service()

    # --------------------------------------------------
    # Google Drive
    # --------------------------------------------------

    def _create_drive_service(self):
        credentials, _ = google.auth.default(
            scopes=SCOPES
        )

        return build(
            "drive",
            "v3",
            credentials=credentials
        )

    # --------------------------------------------------
    # Main operation
    # --------------------------------------------------

    def process_music(
        self,
        file_url: str
    ):
        file_path = None

        try:
            # 1. Download
            file_path = self.download_music(
                file_url
            )

            file_name = Path(file_path).name

            # 2. Check duplicate
            if self.check_duplicate(file_name):
                return {
                    "status": "duplicate",
                    "fileName": file_name
                }

            # 3. Upload
            result = self.upload_to_google_drive(
                file_path
            )

            return {
                "status": "success",
                "fileName": file_name,
                "fileId": result["id"]
            }

        finally:
            # Delete temporary file
            if (
                file_path
                and os.path.exists(file_path)
            ):
                os.remove(file_path)

    # --------------------------------------------------
    # YouTube
    # --------------------------------------------------

    def download_music(
        self,
        url: str
    ) -> str:

        print(f"Downloading: {url}")

        yt = YouTube(url)

        print(f"Title: {yt.title}")

        stream = (
            yt.streams
            .filter(only_audio=True)
            .order_by("abr")
            .desc()
            .first()
        )

        if stream is None:
            raise RuntimeError(
                "No audio stream found."
            )

        file_path = stream.download(
            output_path=DOWNLOAD_DIRECTORY
        )

        print(
            f"Downloaded: {file_path}"
        )

        return file_path

    # --------------------------------------------------
    # Duplicate check
    # --------------------------------------------------

    def check_duplicate(
        self,
        file_name: str
    ) -> bool:

        escaped_name = (
            file_name
            .replace("'", "\\'")
        )

        query = (
            f"name = '{escaped_name}' "
            f"and trashed = false"
        )

        if GOOGLE_DRIVE_FOLDER_ID:
            query += (
                f" and "
                f"'{GOOGLE_DRIVE_FOLDER_ID}' "
                f"in parents"
            )

        response = (
            self.drive_service
            .files()
            .list(
                q=query,
                spaces="drive",
                fields="files(id,name)",
                pageSize=1
            )
            .execute()
        )

        files = response.get(
            "files",
            []
        )

        return len(files) > 0

    # --------------------------------------------------
    # Google Drive upload
    # --------------------------------------------------

    def upload_to_google_drive(
        self,
        file_path: str
    ):

        file_name = Path(
            file_path
        ).name

        metadata = {
            "name": file_name
        }

        if GOOGLE_DRIVE_FOLDER_ID:
            metadata["parents"] = [
                GOOGLE_DRIVE_FOLDER_ID
            ]

        media = MediaFileUpload(
            file_path,
            resumable=True
        )

        uploaded_file = (
            self.drive_service
            .files()
            .create(
                body=metadata,
                media_body=media,
                fields="id,name"
            )
            .execute()
        )

        print(
            f"Uploaded: "
            f"{uploaded_file['name']} "
            f"({uploaded_file['id']})"
        )

        return uploaded_file