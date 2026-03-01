from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile
from app.core.config import settings
import uuid
import os

class AppwriteStorage:
    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        self.storage = Storage(self.client)
        self.bucket_id = settings.APPWRITE_BUCKET_ID

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        """
        Uploads a file to Appwrite Storage and returns the public URL.
        """
        file_id = str(uuid.uuid4())
        
        # Temporary file to use with Appwrite InputFile (SDK limitation often requires a path)
        temp_path = f"/tmp/{filename}"
        with open(temp_path, "wb") as f:
            f.write(file_content)
            
        try:
            result = self.storage.create_file(
                bucket_id=self.bucket_id,
                file_id=file_id,
                file=InputFile.from_path(temp_path)
            )
            # Generate the view URL
            url = f"{settings.APPWRITE_ENDPOINT}/storage/buckets/{self.bucket_id}/files/{file_id}/view?project={settings.APPWRITE_PROJECT_ID}"
            return url
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

storage_service = AppwriteStorage()
