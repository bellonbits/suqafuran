import io
import os
import uuid
from app.core.config import settings

MAX_WIDTH = 1200
MAX_HEIGHT = 1200
WEBP_QUALITY = 82


class LocalStorage:
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        unique_name = f"{uuid.uuid4()}.webp"
        dest = os.path.join(settings.UPLOAD_DIR, unique_name)

        try:
            from PIL import Image
            img = Image.open(io.BytesIO(file_content))

            # Convert to RGB (WebP doesn't support palette/alpha in all cases)
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")

            # Resize down if oversized — keeps aspect ratio
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)

            # Save as WebP (~60% smaller than JPEG at same quality)
            img.save(dest, format="WEBP", quality=WEBP_QUALITY, method=6)

        except Exception:
            # Fallback: save original bytes unchanged
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
            unique_name = f"{uuid.uuid4()}.{ext}"
            dest = os.path.join(settings.UPLOAD_DIR, unique_name)
            with open(dest, "wb") as f:
                f.write(file_content)

        return f"/api/v1/listings/images/{unique_name}"


storage_service = LocalStorage()
