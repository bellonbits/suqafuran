import io
import os
import uuid
from app.core.config import settings

MAX_WIDTH = 1200
MAX_HEIGHT = 1200
WEBP_QUALITY = 82


def _resize_to_bytes(file_content: bytes) -> bytes:
    """Resize image and return as JPEG bytes for Cloudinary upload."""
    try:
        from PIL import Image, ImageOps
        img = Image.open(io.BytesIO(file_content))
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=WEBP_QUALITY, optimize=True)
        return buf.getvalue()
    except Exception:
        return file_content


def calculate_phash(file_content: bytes) -> str:
    """Calculate perceptual hash of an image for duplicate detection."""
    try:
        from PIL import Image
        import imagehash
        img = Image.open(io.BytesIO(file_content))
        # Use average hash for speed, or phash for better robustness
        h = imagehash.phash(img)
        return str(h)
    except Exception:
        return ""


class CloudinaryStorage:
    def __init__(self):
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

    async def upload_file(self, file_content: bytes, filename: str) -> tuple[str, str]:
        import cloudinary.uploader
        
        filename = filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        is_video = ext in ["mp4", "mov", "avi", "3gp", "webm", "mpeg", "mkv"]
        is_pdf = ext == "pdf"
        
        phash = ""
        if not is_video and not is_pdf:
            phash = calculate_phash(file_content)
            resized = _resize_to_bytes(file_content)
            resource_type = "image"
            upload_format = "webp"
            transformation = [{"quality": "auto", "fetch_format": "auto"}]
        elif is_pdf:
            resized = file_content
            resource_type = "raw"
            upload_format = None
            transformation = None
        else:
            resized = file_content
            resource_type = "video"
            upload_format = None
            transformation = None

        public_id = f"suqafuran/{uuid.uuid4().hex}"
        
        upload_kwargs = {
            "public_id": public_id,
            "overwrite": True,
            "resource_type": resource_type,
        }
        if upload_format:
            upload_kwargs["format"] = upload_format
        if transformation:
            upload_kwargs["transformation"] = transformation
            
        result = cloudinary.uploader.upload(resized, **upload_kwargs)
        return result["secure_url"], phash


class LocalStorage:
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> tuple[str, str]:
        phash = calculate_phash(file_content)
        unique_name = f"{uuid.uuid4()}.webp"
        dest = os.path.join(settings.UPLOAD_DIR, unique_name)

        try:
            from PIL import Image, ImageOps
            img = Image.open(io.BytesIO(file_content))
            img = ImageOps.exif_transpose(img)
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)
            img.save(dest, format="WEBP", quality=WEBP_QUALITY, method=6)
        except Exception:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
            unique_name = f"{uuid.uuid4()}.{ext}"
            dest = os.path.join(settings.UPLOAD_DIR, unique_name)
            with open(dest, "wb") as f:
                f.write(file_content)

        return f"/api/v1/listings/images/{unique_name}", phash


# Use Cloudinary if credentials are configured, otherwise local disk
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    storage_service = CloudinaryStorage()
else:
    storage_service = LocalStorage()

