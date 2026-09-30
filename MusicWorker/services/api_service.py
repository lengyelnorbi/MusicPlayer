# services/api_service.py

import requests

from config import API_BASE_URL, API_INTERNAL_KEY


class ApiService:

    def __init__(self):
        self.base_url = API_BASE_URL.rstrip("/")

        self.headers = {
            "Content-Type": "application/json"
        }

        if API_INTERNAL_KEY:
            self.headers["X-Internal-Key"] = API_INTERNAL_KEY

    def update_job_status(
        self,
        job_id: str,
        status: str,
        error: str | None = None,
        third_party_id: str | None = None
    ):
        url = f"{self.base_url}/internal/upload-jobs/{job_id}"

        payload = {
            "status": status
        }

        if error is not None:
            payload["error"] = error

        if third_party_id is not None:
            payload["thirdPartyId"] = third_party_id

        response = requests.patch(
            url,
            json=payload,
            headers=self.headers,
            timeout=30
        )

        response.raise_for_status()

        return response.json() if response.content else None

    def get_job(self, job_id: str):
        url = f"{self.base_url}/internal/upload-jobs/{job_id}"

        response = requests.get(
            url,
            headers=self.headers,
            timeout=30
        )

        response.raise_for_status()

        return response.json()