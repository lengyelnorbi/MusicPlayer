import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

from yt_dlp import DownloadError, YoutubeDL

from config import ALLOWED_SOURCE_DOMAINS, MUSIC_TEMP_PATH, PROXY_ATTEMPTS, PROXY_URLS


class ProxyForbiddenError(RuntimeError):
    """Raised when every configured downloader route is rejected with HTTP 403."""


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
    # The API container finalizes and removes completed files. Keep the shared
    # bind-mounted directory writable across the worker/API container users.
    os.chmod(MUSIC_TEMP_PATH, 0o777)
    os.chmod(work_dir, 0o777)

    # Remove stale files from a previous attempt for this work item.
    for item in work_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    base_options = {
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

    routes = PROXY_URLS or [None]
    max_attempts = min(PROXY_ATTEMPTS, len(routes))
    last_error: Exception | None = None
    info = None

    for offset in range(max_attempts):
        proxy = routes[(hash(work_item_id) + offset) % len(routes)]
        options = {**base_options}
        if proxy:
            options["proxy"] = proxy

        try:
            with YoutubeDL(options) as downloader:
                info = downloader.extract_info(url, download=True)
            break
        except DownloadError as exc:
            last_error = exc
            message = str(exc)
            if not is_forbidden_error(message):
                raise
            # A 403 can be route-specific. Remove the partial output before
            # trying the next proxy so a failed attempt cannot be returned.
            for item in work_dir.iterdir():
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
            continue

    if info is None:
        raise ProxyForbiddenError(
            f"All configured YouTube proxy routes returned HTTP 403 Forbidden. "
            f"Attempts: {max_attempts}"
        ) from last_error

    output_path = work_dir / "song.m4a"
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise RuntimeError("Download finished but song.m4a was not created.")

    os.chmod(output_path, 0o666)

    title = safe_title(str(info.get("title") or "song"))
    return output_path, title


def is_forbidden_error(message: str) -> bool:
    normalized = message.lower()
    return "403" in normalized or "forbidden" in normalized
