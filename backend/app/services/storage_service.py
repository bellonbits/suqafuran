import os
import uuid
from app.core.config import settings


class LocalStorage:
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{ext}"
        dest = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(dest, "wb") as f:
            f.write(file_content)
        return f"/api/v1/listings/images/{unique_filename}"


storage_service = LocalStorage()
