import json

from services.music_service import MusicService
from services.api_service import ApiService


music_service = MusicService()
api_service = ApiService()


def handle_music_upload(message: dict):

    job_id = message["jobId"]
    file_url = message["fileUrl"]

    print(
        f"Processing job {job_id}"
    )

    try:

        # ----------------------------------------
        # Processing
        # ----------------------------------------

        api_service.update_job_status(
            job_id,
            "Processing"
        )

        result = music_service.process_music(
            file_url
        )

        # ----------------------------------------
        # Duplicate
        # ----------------------------------------

        if result["status"] == "duplicate":

            api_service.update_job_status(
                job_id,
                "Duplicate"
            )

            return

        # ----------------------------------------
        # Success
        # ----------------------------------------

        api_service.update_job_status(
            job_id,
            "Completed",
            third_party_id=result.get(
                "fileId"
            )
        )

        print(
            f"Job {job_id} completed."
        )

    except Exception as e:

        print(
            f"Job {job_id} failed: {e}"
        )

        api_service.update_job_status(
            job_id,
            "Failed",
            error=str(e)
        )

        # Very important:
        # Let worker.py know the job failed.
        raise