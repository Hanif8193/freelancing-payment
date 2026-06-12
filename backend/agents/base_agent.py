import time
import uuid
from dataclasses import dataclass

from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.ai_log import AIAgentLog, AIAgentType


@dataclass
class AgentResult:
    text: str
    latency_ms: int
    is_fallback: bool


_FALLBACK_TEXT = "AI assistance is temporarily unavailable. Please review the invoice manually."


class BaseAgent:
    MODEL = "claude-sonnet-4-6"

    def __init__(self) -> None:
        self._client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    async def call(
        self,
        system_prompt: str,
        user_content: str,
        agent_type: AIAgentType,
        max_tokens: int = 1024,
        db: AsyncSession | None = None,
        invoice_id: uuid.UUID | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> AgentResult:
        start = time.monotonic()
        is_fallback = False
        text = _FALLBACK_TEXT

        if self._client:
            try:
                message = await self._client.messages.create(
                    model=self.MODEL,
                    max_tokens=max_tokens,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_content}],
                    timeout=30.0,
                )
                text = message.content[0].text
            except Exception:
                is_fallback = True
        else:
            is_fallback = True

        latency_ms = int((time.monotonic() - start) * 1000)

        if db is not None:
            try:
                log = AIAgentLog(
                    agent_type=agent_type.value,
                    invoice_id=invoice_id,
                    actor_id=actor_id,
                    prompt_summary=user_content[:500],
                    response_text=text[:2000],
                    is_fallback=is_fallback,
                    latency_ms=latency_ms,
                )
                db.add(log)
                await db.commit()
            except Exception:
                pass

        return AgentResult(text=text, latency_ms=latency_ms, is_fallback=is_fallback)
