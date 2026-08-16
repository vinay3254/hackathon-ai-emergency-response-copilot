import os
import json
import logging
from typing import Dict, Any
from app.services.fallback import extract_fallback_classification

logger = logging.getLogger(__name__)

REASONING_PROMPT = """You are an AI Emergency Response Copilot. Analyze the following emergency call transcript and output strict JSON with no markdown formatting:
{
  "location_text": "Extracted street/neighborhood or landmark",
  "lat": float or null,
  "lng": float or null,
  "emergency_type": "medical" | "fire" | "accident" | "crime" | "hazard" | "other",
  "severity": integer from 1 to 5,
  "severity_reasoning": "Explicit explanation based on human life risk, vital signs, hazard level",
  "num_people_affected": integer,
  "summary": "Clear, concise dispatch brief (1-2 sentences)",
  "key_entities": ["ENT_1", "ENT_2"],
  "action_required": "Immediate dispatch recommendation"
}

Transcript:
"{transcript}"
"""

async def classify_transcript_with_llm(transcript: str) -> Dict[str, Any]:
    api_key_claude = os.getenv("ANTHROPIC_API_KEY")
    api_key_openai = os.getenv("OPENAI_API_KEY")

    if not api_key_claude and not api_key_openai:
        logger.info("No LLM API keys provided; utilizing explainable fallback classifier.")
        return extract_fallback_classification(transcript)

    try:
        if api_key_claude:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=api_key_claude)
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[{"role": "user", "content": REASONING_PROMPT.format(transcript=transcript)}]
            )
            raw_text = response.content[0].text
            # Extract JSON block
            if "```" in raw_text:
                raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
            return json.loads(raw_text)

        elif api_key_openai:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=api_key_openai)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an AI Emergency Response Dispatcher. Output valid JSON only."},
                    {"role": "user", "content": REASONING_PROMPT.format(transcript=transcript)}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)

    except Exception as exc:
        logger.warning(f"LLM call failed or timed out ({exc}). Engaging backup classifier.")
        return extract_fallback_classification(transcript)

    return extract_fallback_classification(transcript)
