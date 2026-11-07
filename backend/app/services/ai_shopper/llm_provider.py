import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.services.ai_shopper.prompts import AI_SHOPPER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def generate_llm_response(
    prompt: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    system_prompt: str = AI_SHOPPER_SYSTEM_PROMPT,
) -> Optional[str]:
    """
    Calls Groq LLM (llama-3.3-70b-versatile or configured model).
    Falls back gracefully to None if Groq is unconfigured or encounters an error.
    """
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation turns if provided
        if conversation_history:
            for turn in conversation_history[-4:]:
                messages.append({
                    "role": turn.get("role", "user"),
                    "content": turn.get("content", ""),
                })

        messages.append({"role": "user", "content": prompt})

        chat_completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=600,
        )

        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Groq LLM call failed in ai_shopper: {e}")
        return None

