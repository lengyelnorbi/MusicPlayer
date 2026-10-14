import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

from yt_dlp import DownloadError, YoutubeDL

from config import (
    ALLOWED_SOURCE_DOMAINS,
    MUSIC_TEMP_PATH,
    PROXY_ATTEMPTS,
    PROXY_URLS,
    YTDLP_COOKIES_FILE,
)


class ProxyForbiddenError(RuntimeError):
    """Raised when every configured downloader route is rejected by the source."""


class ContentUnavailableError(RuntimeError):
    """Raised when the requested content cannot be downloaded on any route."""


class AgeRestrictedError(RuntimeError):
    """Raised when YouTube requires authenticated age verification."""


# Validates that a URL is a valid HTTP or HTTPS URL and is not a local URL.
def validate_url(url: str) -> None:
    # Validate that the URL is a valid HTTP or HTTPS URL and is not a local URL.
    parsed = urlparse(url)
    # Validate that the URL has a valid scheme and hostname.
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("URL must be a valid HTTP or HTTPS URL.")

    # Validate that the URL is not a local URL (localhost,
    host = parsed.hostname.lower().rstrip(".")
    if host in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Local URLs are not allowed.")

    if ALLOWED_SOURCE_DOMAINS and not any(
        host == domain or host.endswith("." + domain)
        for domain in ALLOWED_SOURCE_DOMAINS
    ):
        raise ValueError("This source domain is not allowed.")

# Sanitize a string to be safe for use as a filename. Replace invalid characters with underscores and limit the length to 180 characters.
def safe_title(value: str) -> str:
    value = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", value).strip(" .")
    return value[:180] or "song"

# Download audio from a URL using yt-dlp, handling proxies and errors. Returns the path to the downloaded file and the sanitized title.
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

    if YTDLP_COOKIES_FILE:
        cookies_path = Path(YTDLP_COOKIES_FILE)
        if not cookies_path.is_file():
            raise RuntimeError(
                "YTDLP_COOKIES_FILE is configured, but the mounted cookie file "
                "does not exist."
            )
        base_options["cookiefile"] = str(cookies_path)

    routes = PROXY_URLS or [None]
    max_attempts = min(PROXY_ATTEMPTS, len(routes))
    last_error: Exception | None = None
    info = None

    # Attempt to download the audio using each proxy route until successful or all routes are exhausted.
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
            if is_age_restricted_error(message):
                raise AgeRestrictedError(
                    "This YouTube video is age-restricted. Configure a valid "
                    "Netscape cookie file with YTDLP_COOKIES_FILE."
                ) from exc
            if is_content_unavailable_error(message):
                raise ContentUnavailableError(
                    "This content is unavailable for download. It may be blocked "
                    "by copyright, region, privacy, or uploader restrictions."
                ) from exc
            if not is_forbidden_error(message) and not is_transient_source_block_error(message):
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
            "The source rejected every downloader route. This usually means the "
            "current IP/proxy was rate-limited or temporarily blocked. "
            f"Attempts: {max_attempts}"
        ) from last_error

    output_path = work_dir / "song.m4a"
    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise RuntimeError("Download finished but song.m4a was not created.")

    os.chmod(output_path, 0o666)

    title = safe_title(str(info.get("title") or "song"))
    return output_path, title

# Utility functions to classify yt-dlp error messages for specific conditions.
def is_forbidden_error(message: str) -> bool:
    normalized = message.lower()
    return "403" in normalized or "forbidden" in normalized

# Utility functions to classify yt-dlp error messages for specific conditions.
def is_content_unavailable_error(message: str) -> bool:
    """Return True for source/content restrictions, not downloader IP blocks."""
    normalized = message.lower().replace("’", "'")
    permanent_markers = (
        "video unavailable",
        "this video is unavailable",
        "content is unavailable",
        "content isn't available",
        "content is not available",
        "video has been removed",
        "this video has been removed",
        "private video",
        "copyright claim",
        "copyright restriction",
        "blocked by copyright",
        "copyright",
        "not available in your country",
        "not available in your region",
        "uploader has made this video unavailable",
    )
    return any(marker in normalized for marker in permanent_markers)

# Utility functions to classify yt-dlp error messages for specific conditions.
def is_age_restricted_error(message: str) -> bool:
    normalized = message.lower()
    return any(
        marker in normalized
        for marker in (
            "sign in to confirm your age",
            "confirm your age",
            "age-restricted",
            "age restricted",
        )
    )

# Utility functions to classify yt-dlp error messages for specific conditions.
def is_transient_source_block_error(message: str) -> bool:
    normalized = message.lower().replace("’", "'")
    transient_markers = (
        "sign in to confirm you're not a bot",
        "sign in to confirm you are not a bot",
        "too many requests",
        "rate limit",
        "temporarily blocked",
        "temporarily unavailable",
    )
    return any(marker in normalized for marker in transient_markers)
