import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

from yt_dlp import YoutubeDL

from config import ALLOWED_SOURCE_DOMAINS, MUSIC_TEMP_PATH


def validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("URL must be a valid HTTP or HTTPS URL.")

    host = parsed.hostname.lower().rstrip(".")
    if host in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Local URLs are not allowed.")

    if ALLOWED_SOURCE_DOMAINS and not any(
        host == domain or host.endswith("." + domain)
        for domain in ALLOWED_SOURCE_DOMAINS
    ):
        raise ValueError("This source domain is not allowed.")


def safe_title(value: str) -> str:
    value = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", value).strip(" .")
    return value[:180] or "song"


def download_audio(url: str, work_item_id: str) -> tuple[Path, str]:
    validate_url(url)

    # Resolve and validate the directory to prevent path traversal from the queue message.
    work_dir = (MUSIC_TEMP_PATH / work_item_id).resolve()
    if MUSIC_TEMP_PATH not in work_dir.parents:
        raise ValueError("Invalid work item path.")

    work_dir.mkdir(parents=True, exist_ok=True)

    # Remove stale files from a previous attempt for this work item.
    for item in work_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    options = {
        "format": "bestaudio/best",
        "outtmpl": str(work_dir / "song.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
        "windowsfilenames": True,
        "overwrites": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "m4a",
                "preferredquality": "0",
            }
        ],
    }

    with YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=True)

    output_path = work_dir / "song.m4a"
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise RuntimeError("Download finished but song.m4a was not created.")

    title = safe_title(str(info.get("title") or "song"))
    return output_path, title
