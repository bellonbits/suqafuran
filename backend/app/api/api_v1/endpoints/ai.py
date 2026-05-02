from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()

class ParseRequest(BaseModel):
    text: str

@router.post("/listings/parse")
def parse_listing(body: ParseRequest):
    text = body.text.strip()
    
    # Very basic heuristics for 10-second listing
    # Example: "iPhone 11 25k Nairobi"
    
    price = None
    # Look for patterns like "25k", "25,000", "25000", "$200"
    price_match = re.search(r'(\d+)[kK]', text)
    if price_match:
        price = int(price_match.group(1)) * 1000
        # remove price from text
        text = re.sub(r'(\d+)[kK]', '', text, count=1)
    else:
        price_match = re.search(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
        if price_match:
            try:
                price = float(price_match.group(1).replace(',', ''))
                text = text.replace(price_match.group(0), '', 1)
            except:
                pass
                
    # Guess Category
    category_id = None
    lower_text = text.lower()
    if 'iphone' in lower_text or 'samsung' in lower_text or 'macbook' in lower_text or 'laptop' in lower_text or 'phone' in lower_text:
        category_id = 1 # Usually Electronics / Mobile Phones
    elif 'car' in lower_text or 'toyota' in lower_text or 'nissan' in lower_text:
        category_id = 2 # Vehicles
    elif 'sofa' in lower_text or 'bed' in lower_text or 'chair' in lower_text:
        category_id = 3 # Furniture
        
    # Condition heuristic
    condition = "Used"
    if 'new' in lower_text.split():
        condition = "New"
        text = re.sub(r'\bnew\b', '', text, flags=re.IGNORECASE)
        
    # Clean up title
    title = re.sub(r'\s+', ' ', text).strip()
    
    return {
        "title_en": title,
        "title_so": title,
        "description_en": f"Selling: {title}. Excellent condition, message me for details.",
        "description_so": f"Waan iibinayaa: {title}. Xaalad fiican, ila soo xiriir.",
        "price": price,
        "category_id": category_id,
        "condition": condition
    }
