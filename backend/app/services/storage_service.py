from app.core.config import settings
import uuid
import os


class AppwriteStorage:
    def __init__(self):
        self._use_appwrite = bool(
            settings.APPWRITE_PROJECT_ID
            and settings.APPWRITE_API_KEY
            and settings.APPWRITE_BUCKET_ID
        )
        if self._use_appwrite:
            from appwrite.client import Client
            from appwrite.services.storage import Storage
            self._client = Client()
            self._client.set_endpoint(settings.APPWRITE_ENDPOINT)
            self._client.set_project(settings.APPWRITE_PROJECT_ID)
            self._client.set_key(settings.APPWRITE_API_KEY)
            self._storage = Storage(self._client)
            self._bucket_id = settings.APPWRITE_BUCKET_ID

        # Ensure local upload dir exists (used as fallback)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        if self._use_appwrite:
            return await self._upload_appwrite(file_content, filename)
        return self._upload_local(file_content, filename)

    async def _upload_appwrite(self, file_content: bytes, filename: str) -> str:
        from appwrite.input_file import InputFile
        file_id = str(uuid.uuid4())
        temp_path = f"/tmp/{filename}"
        with open(temp_path, "wb") as f:
            f.write(file_content)
        try:
            self._storage.create_file(
                bucket_id=self._bucket_id,
                file_id=file_id,
                file=InputFile.from_path(temp_path),
            )
            return (
                f"{settings.APPWRITE_ENDPOINT}/storage/buckets/{self._bucket_id}"
                f"/files/{file_id}/view?project={settings.APPWRITE_PROJECT_ID}"
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _upload_local(self, file_content: bytes, filename: str) -> str:
        dest = os.path.join(settings.UPLOAD_DIR, filename)
        with open(dest, "wb") as f:
            f.write(file_content)
        return f"/api/v1/listings/images/{filename}"


storage_service = AppwriteStorage()
