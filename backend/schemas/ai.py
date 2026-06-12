from pydantic import BaseModel


class AIResponse(BaseModel):
    text: str
    agent_type: str
    is_fallback: bool
    latency_ms: int


class ValidateInvoiceResponse(BaseModel):
    is_complete: bool
    missing_fields: list[str]
    issues: list[str]
    suggestions: list[str]
    ai_response: AIResponse


class ReminderRunResponse(BaseModel):
    due_reminders_sent: int
    overdue_followups_sent: int
