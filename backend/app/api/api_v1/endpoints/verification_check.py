from fastapi import APIRouter, File, UploadFile
from app.services.ai_service import ai_service
import base64

router = APIRouter()

@router.post("/check-match")
async def check_match(
    selfie_file: UploadFile = File(...),
    document_file: UploadFile = File(...)
):
    selfie_content = await selfie_file.read()
    document_content = await document_file.read()
    
    selfie_b64 = base64.b64encode(selfie_content).decode("utf-8")
    doc_b64 = base64.b64encode(document_content).decode("utf-8")
    
    score, is_authentic, reason = ai_service.verify_identity(selfie_b64, doc_b64)
    
    return {
        "match_score": score,
        "is_authentic": is_authentic,
        "reason": reason
    }
