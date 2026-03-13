from app.core.config import settings
import uuid
import os


class CloudinaryStorage:
    def __init__(self):
        self._use_cloudinary = bool(
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        )
        if self._use_cloudinary:
            import cloudinary
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

        # Ensure local upload dir exists (used as fallback)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        if self._use_cloudinary:
            return self._upload_cloudinary(file_content, filename)
        return self._upload_local(file_content, filename)

    def _upload_cloudinary(self, file_content: bytes, filename: str) -> str:
        import cloudinary.uploader
        public_id = f"suqafuran/{uuid.uuid4()}"
        result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            folder="suqafuran",
            resource_type="image",
        )
        return result["secure_url"]

    def _upload_local(self, file_content: bytes, filename: str) -> str:
        dest = os.path.join(settings.UPLOAD_DIR, filename)
        with open(dest, "wb") as f:
            f.write(file_content)
        return f"/api/v1/listings/images/{filename}"


storage_service = CloudinaryStorage()
