
import requests
from io import BytesIO
from PIL import Image

def load_image_from_url(url: str):
    response = requests.get(url)
    response.raise_for_status()
    image_file = BytesIO(response.content)
    try:
        import face_recognition
        image = face_recognition.load_image_file(image_file)
        return image
    except ImportError:
        # Fallback to PIL if face_recognition is missing (though load_image_file does more)
        return Image.open(image_file)

def verify_faces(reference_image_url: str, selfie_image_url: str) -> dict:
    """
    Compare a reference ID image with a selfie image.
    Returns a dictionary with match status and score.
    """
    try:
        import face_recognition
        import numpy as np
    except ImportError:
        return {"success": False, "error": "Face recognition or numpy library not installed on server"}

    try:
        # Load images
        ref_image = load_image_from_url(reference_image_url)
        selfie_image = load_image_from_url(selfie_image_url)

        # Get face encodings
        ref_encodings = face_recognition.face_encodings(ref_image)
        selfie_encodings = face_recognition.face_encodings(selfie_image)

        # Check if faces were found
        if len(ref_encodings) == 0:
            return {"success": False, "error": "No face found in reference ID document"}
        if len(selfie_encodings) == 0:
            return {"success": False, "error": "No face found in selfie"}
        
        if len(ref_encodings) > 1:
            return {"success": False, "error": "Multiple faces found in reference ID document"}
        if len(selfie_encodings) > 1:
            return {"success": False, "error": "Multiple faces found in selfie"}

        # Compare faces
        distance = face_recognition.face_distance([ref_encodings[0]], selfie_encodings[0])[0]
        
        # Convert distance to a "match score" (0 to 100, where 100 is perfect match)
        match_score = max(0, (1.0 - distance) * 100)
        
        is_match = distance < 0.6 

        return {
            "success": True,
            "is_match": bool(is_match),
            "match_score": float(match_score),
            "distance": float(distance)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

def verify_faces_from_disk(ref_image_path: str, selfie_image_path: str) -> dict:
    """
    Compare a reference ID image with a selfie image using local file paths.
    Returns a dictionary with match status and score.
    """
    try:
        import face_recognition
        import numpy as np
    except ImportError:
        return {"success": False, "error": "Face recognition or numpy library not installed on server"}

    try:
        # Load images directly from disk
        ref_image = face_recognition.load_image_file(ref_image_path)
        selfie_image = face_recognition.load_image_file(selfie_image_path)

        # Get face encodings
        ref_encodings = face_recognition.face_encodings(ref_image)
        selfie_encodings = face_recognition.face_encodings(selfie_image)

        # Check if faces were found
        if len(ref_encodings) == 0:
            return {"success": False, "error": "No face found in reference ID document"}
        if len(selfie_encodings) == 0:
            return {"success": False, "error": "No face found in selfie"}
        
        # Compare faces
        distance = face_recognition.face_distance([ref_encodings[0]], selfie_encodings[0])[0]
        
        # Convert distance to a "match score" (0 to 100, where 100 is perfect match)
        match_score = max(0, (1.0 - distance) * 100)
        
        is_match = distance < 0.6 

        return {
            "success": True,
            "is_match": bool(is_match),
            "match_score": float(match_score),
            "distance": float(distance)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
