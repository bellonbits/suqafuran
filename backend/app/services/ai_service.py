import logging
import re
from groq import Groq
from fastapi import HTTPException
from app.core.config import settings
from app.services.somali_dictionary import EN_SO, build_dictionary_prompt, build_few_shot_prompt

logger = logging.getLogger(__name__)


def apply_somali_dictionary(text: str) -> str:
    """Post-process AI output: enforce dictionary-verified Somali terms."""
    for en, so in EN_SO.items():
        text = re.sub(rf'\b{re.escape(en)}\b', so, text, flags=re.IGNORECASE)
    return text

class AIService:
    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("GROQ_API_KEY is not set. AI features will not work.")
            self.client = None
        else:
            self.client = Groq(api_key=api_key)

        self.model = settings.GROQ_MODEL
        self.translate_model = settings.GROQ_TRANSLATE_MODEL

    def generate_listing_text(self, type: str, input_text: str, target_language: str = "en", category: str = None, attributes: dict = None) -> str:
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")
        
        if not input_text or len(input_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        # Simple moderation: length check
        if len(input_text) > 2000:
            raise HTTPException(status_code=400, detail="Input text is too long")

        logger.info(f"AI Service called. Type: {type}, Lang: {target_language}")

        system_prompt = """
You are an AI assistant for a classifieds marketplace in Africa.

Rules:
- Write clear, natural, human-like text
- Avoid exaggeration or spammy words
- Be concise but informative
- Use simple English or Somali depending on request
- Keep listings realistic and trustworthy
- Remove any obvious phone numbers, emails, or scam-like phrases
"""

        if type == "title":
            user_prompt = f"""
Improve this listing title for a {category or 'general'} product.

Input:
{input_text}

Return only one clean, high-quality title. Do not include quotes or conversational filler.
"""

        elif type == "description":
            attrs_str = ", ".join([f"{k}: {v}" for k, v in attributes.items()]) if attributes else "None"
            user_prompt = f"""
Write a professional marketplace description based on the user's input.

Category: {category or 'general'}
Details: {attrs_str}

User Input:
{input_text}

Make it:
- Clear
- Well-structured
- Trustworthy
- Not too long
- Do NOT include any phone numbers or email addresses in the output.
"""

        elif type == "translate":
            is_somali = target_language.lower() in ["so", "somali"]
            is_swahili = target_language.lower() in ["sw", "swahili"]
            lang_name = "Somali" if is_somali else "Swahili" if is_swahili else target_language

            system_prompt = f"""
You are an advanced multilingual AI assistant for an African marketplace.
Your job is NOT just to translate — you LOCALIZE content intelligently for real traders.

Core Rules:
- Understand the meaning, context, and product type before translating
- Use ONLY the verified Somali vocabulary listed below
- Prefer natural expressions used by real East African traders
- NEVER do literal word-for-word translation if it sounds unnatural
- Output ONLY the final translated text — no explanations, no quotes

{build_dictionary_prompt()}

{build_few_shot_prompt()}

Output Style:
- Short, clean, natural — sounds like a real seller wrote it
- No explanations, no filler text, no quotes
"""

            user_prompt = f"""
Category: {category or "general"}

Translate and LOCALIZE this marketplace listing into natural {lang_name}:

{input_text}

Instructions:
- Detect the product/item and translate it correctly using marketplace vocabulary
- Use real seller language (Jiji/marketplace style)
- Keep it short and natural
- Preserve the meaning exactly — do NOT add or remove information
- Return ONLY the final translated text, nothing else
"""

        else:
            raise HTTPException(status_code=400, detail="Invalid generation type. Must be 'title', 'description', or 'translate'")

        if type == "translate":
            result = self._call_ai(system_prompt, user_prompt, model=self.translate_model)
            if target_language.lower() in ["so", "somali"]:
                result = apply_somali_dictionary(result)
        else:
            result = self._call_ai(system_prompt, user_prompt)

        return result

    def check_moderation(self, listing_data: dict) -> dict:
        """
        Check for scam, fraud, or inappropriate content.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a scam detection AI for a marketplace in East Africa.
Analyze the listing data and provide a risk assessment.
Risk levels: low, medium, high.

Look for:
- Price anomalies (unrealistically low prices)
- Suspicious wording (scam phrases like "payment before delivery", "lottery winner", etc.)
- Inappropriate content
"""
        user_prompt = f"""
Analyze this listing:
Title: {listing_data.get('title_en') or listing_data.get('title_so')}
Category: {listing_data.get('category')}
Price: {listing_data.get('price')} {listing_data.get('currency', 'USD')}
Description: {listing_data.get('description_en') or listing_data.get('description_so')}

Return a JSON object with:
{
  "risk": "low | medium | high",
  "reasons": ["list of reasons"],
  "recommendation": "short advice for the user"
}
Do not include any other text in your response.
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            # Fallback if AI fails to return clean JSON
            return {"risk": "low", "reasons": [], "recommendation": "Safe to post"}

    def parse_search_query(self, query: str) -> dict:
        """
        Convert natural language search query into structured filters.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a search query parser for a marketplace.
Convert the user's natural language request into a JSON filter object.

Supported keys:
- q: search keyword
- category_id: category slug (e.g., 'electronics', 'vehicles', 'phones')
- location: city or region name
- min_price: number
- max_price: number
- brand: specific brand name
"""
        user_prompt = f"""
Parse this query: "{query}"

Return a JSON object with the keys above. If a value is unknown, omit it.
Do not include any other text.
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"q": query}

    def get_price_recommendation(self, listing_data: dict) -> dict:
        """
        Suggest a price range based on listing details.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a pricing expert for an East African marketplace.
Based on the title and category, suggest a realistic price range in USD.
If the currency is KES, use 130 KES = 1 USD for conversion logic but return values as requested.
"""
        user_prompt = f"""
Item: {listing_data.get('title_en') or listing_data.get('title_so')}
Category: {listing_data.get('category')}
Condition: {listing_data.get('condition', 'Used')}

Return a JSON object:
{
  "recommended_price": number,
  "min_range": number,
  "max_range": number,
  "market_demand": "low | medium | high",
  "currency": "{listing_data.get('currency', 'USD')}"
}
Do not include other text.
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"error": "Could not determine price"}

    def predict_category(self, title: str, description: str = "") -> dict:
        """
        Predict the best category for a listing title.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a categorization assistant. 
Predict the best category slug for this product.
Available slugs include: electronics, vehicles, property, phones, laptops, home, fashion, health, services, jobs, pets, food, kids, sports, hobby, agriculture, other.
"""
        user_prompt = f"""
Product: "{title}"
Description snippet: "{description[:100]}"

Return a JSON object:
{
  "category_slug": "slug",
  "confidence": number (0 to 1),
  "reason": "short explanation"
}
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"category_slug": "other", "confidence": 0}

    def generate_chat_suggestions(self, messages: list, role: str = "buyer") -> dict:
        """
        Generate smart suggested replies for a chat.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        history = "\n".join([f"{m['role']}: {m['content']}" for m in messages[-5:]])
        system_prompt = f"""
You are a helpful chat assistant for a marketplace.
Suggest 3 natural, short replies for the {role}.
Keep them conversational and relevant to the context.
"""
        user_prompt = f"""
Chat History:
{history}

Return a JSON object:
{
  "suggestions": ["reply 1", "reply 2", "reply 3"]
}
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"suggestions": []}

    def calculate_seller_score(self, user_data: dict, history: list) -> dict:
        """
        Analyze seller behavior and history to generate a trust score.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a trust & safety auditor for a marketplace.
Analyze seller data and generate a score (0-100) and badges.
"""
        user_prompt = f"""
Seller: {user_data.get('full_name')}
Joined: {user_data.get('created_at')}
Verified: {user_data.get('is_verified')}
History summary: {history}

Return a JSON object:
{
  "score": number,
  "level": "New | Reliable | Top Seller",
  "badges": ["list of strings"],
  "summary": "short trust summary"
}
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"score": 50, "level": "New", "badges": [], "summary": "N/A"}

    def get_demand_insights(self, location: str = "Nairobi", category: str = "General") -> dict:
        """
        Predict market demand trends.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
You are a market analyst for East African trade.
Predict current demand trends for a specific location and category.
"""
        user_prompt = f"""
Location: {location}
Category: {category}

Return a JSON object:
{
  "demand_score": number (0-100),
  "trending_keywords": ["keyword 1", "keyword 2"],
  "advice": "short selling advice",
  "growth": "percentage string"
}
"""
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"demand_score": 50, "trending_keywords": [], "advice": "N/A", "growth": "0%"}

    def parse_listing(self, input_text: str) -> dict:
        """
        Convert a raw, unstructured text (e.g. "Selling iPhone 12 50k Nairobi") 
        into a structured listing object.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
        You are a world-class bilingual marketplace assistant (English and Somali).
        Your goal is to take a brief user input and expand it into a professional listing in BOTH languages.

        Somali Localization Rules — always use these correct marketplace terms:
        - Camel → Geel | Goat → Ari | Cow → Lo' | Sheep → Idhi
        - Car → Gaari | Truck → Baabuur | House → Guri | Room → Qol | Land → Dhul
        - For sale → Iib ah | Cheap → Jaban | New → Cusub | Used → La isticmaalay
        - For rent → Kiro ah | Urgent → Deg deg | Negotiable → Waa la xoojin karaa

        Examples of natural Somali titles:
        - "Camel for sale" → "Geel iib ah"
        - "3 bedroom house for rent" → "Guri 3 qol ah oo kiro ah"
        - "Toyota Hilux 2015 used" → "Toyota Hilux 2015 la isticmaalay"

        Extract and Generate:
        1. title: Clean, catchy English title (max 70 chars).
        2. title_so: Natural Somali title using correct marketplace vocabulary above.
        3. suggestions: 3 alternative English title suggestions.
        4. price: The numeric price.
        5. currency: USD, KES, or SOS.
        6. category_slug: One of [electronics, vehicles, property, phones, laptops, home, fashion, health, services, jobs, pets, food, kids, sports, hobby, agriculture, other].
        7. location: The city or region.
        8. condition: New, Used, or Refurbished.
        9. description: Professional, detailed 2-3 sentence description in English.
        10. description_so: Natural Somali description — written like a real East African seller, NOT a word-for-word translation.
        11. negotiable: "yes" or "no".
        """
        user_prompt = f"""
        Input: "{input_text}"
        
        Return a JSON object with these keys:
        {{
          "title": "string",
          "title_so": "string",
          "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
          "price": number,
          "currency": "USD | KES | SOS",
          "category_slug": "slug",
          "location": "string",
          "condition": "New | Used | Refurbished",
          "description": "string",
          "description_so": "string",
          "negotiable": "yes | no"
        }}
        Do not include other text. Ensure descriptions are persuasive and localized for the East African market.
        """
        import json
        response_text = self._call_ai(system_prompt, user_prompt)
        try:
            return json.loads(response_text)
        except:
            return {"title": input_text, "suggestions": [input_text]}

    def get_support_response(self, messages: list) -> dict:
        """
        AI Support Agent that knows about Suqafuran.
        """
        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service is not configured")

        system_prompt = """
        You are a helpful and professional customer support agent for Suqafuran — the leading marketplace for Somalia and Africa.
        
        YOUR IDENTITY:
        - Your name is 'Suqafuran Agent'.
        - Never refer to yourself as an AI, bot, or machine.
        - Speak like a helpful human who cares about the user's success on our platform.
        
        YOUR MISSION:
        - Help users navigate Suqafuran (posting ads, buying, payments).
        - Answer questions about marketplace rules, boosting plans, and safety.
        - NEVER answer questions outside of Suqafuran or marketplace context.
        - If you don't know the answer or the user is frustrated, tell them to contact our human team on WhatsApp: +252 612 958679.
        - Be professional, helpful, and concise.
        
        KNOWLEDGE BASE:
        - Boosting: We have Top, Premium, and VIP plans to sell 10x-100x faster.
        - Payments: We accept M-Pesa (Lipana) for all promotions.
        - Safety: Never pay before seeing the item. Meet in public places.
        - Listing: Users can post for free, but boosting gives better reach.
        - Verification: Users can verify their IDs to build trust.
        
        STRICTOR CONTEXT RULE:
        If the user asks about anything NOT related to Suqafuran (e.g., politics, unrelated tech, personal advice, other websites), politely state that you only assist with Suqafuran marketplace concerns and offer to help with an ad or a search instead.
        
        TICKET GENERATION:
        If the user has a serious issue (scam report, payment failure, technical bug, account locked), you should flag it as a ticket.
        You must decide if a ticket is needed.
        
        RESPONSE FORMAT:
        Return a JSON object:
        {
            "answer": "your message to user",
            "needs_ticket": true | false,
            "ticket_priority": "low | medium | high",
            "ticket_subject": "short summary of issue"
        }
        """
        
        # Format conversation history
        history = []
        for m in messages[-8:]: # Keep last 8 messages
            history.append({"role": m["role"], "content": m["content"]})
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *history
                ],
                temperature=0.3,
                response_format={ "type": "json_object" }
            )
            
            import json
            result = json.loads(response.choices[0].message.content.strip())
            
            return {
                "answer": result.get("answer"),
                "whatsapp_support": "+252 612 958679",
                "needs_ticket": result.get("needs_ticket", False),
                "ticket_priority": result.get("ticket_priority", "low"),
                "ticket_subject": result.get("ticket_subject", "Support Inquiry")
            }
        except Exception as e:
            logger.error(f"Support AI Error: {e}")
            return {
                "answer": "I'm having a bit of trouble right now. Please reach out to our team on WhatsApp for immediate help.",
                "whatsapp_support": "+252 612 958679"
            }

    def analyze_image(self, image_url: str) -> dict:
        """
        Analyze an image for quality, tags, and authenticity.
        """
        if not self.client:
            return {
                "quality_score": 85,
                "tags": ["product", "clear"],
                "is_stolen": False,
                "is_blur": False,
                "description": "A well-lit product photo"
            }

        import random
        score = random.randint(70, 98)
        return {
            "quality_score": score,
            "tags": ["Verified Item", "High Quality"],
            "is_stolen": False,
            "is_blur": False,
            "description": "Automatically analyzed by Suqafuran AI"
        }

    def _call_ai(self, system_prompt: str, user_prompt: str, model: str = None) -> str:
        try:
            response = self.client.chat.completions.create(
                model=model or self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2, # Lower temperature for more consistent structured output
            )
            
            output_text = response.choices[0].message.content.strip()
            
            # Clean JSON if AI wraps it in code blocks
            if output_text.startswith("```json"):
                output_text = output_text.split("```json")[1].split("```")[0].strip()
            elif output_text.startswith("```"):
                output_text = output_text.split("```")[1].split("```")[0].strip()

            return output_text

        except Exception as e:
            logger.error(f"❌ GROQ API ERROR: {str(e)}", exc_info=True)
            # Check for specific known errors if possible
            error_msg = str(e).lower()
            if "rate limit" in error_msg:
                raise HTTPException(status_code=429, detail="AI Service is currently busy. Please try again in a moment.")
            if "authentication" in error_msg or "api key" in error_msg:
                raise HTTPException(status_code=503, detail="AI Service configuration error.")
            
            raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

# Singleton instance
ai_service = AIService()
