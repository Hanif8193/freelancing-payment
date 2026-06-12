import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.finance_agent import finance_agent
from agents.invoice_agent import invoice_agent
from agents.reminder_agent import reminder_agent
from api.dependencies import get_current_user
from database import get_db
from models.ai_log import AIAgentLog, AIAgentType
from models.user import User, UserRole
from repositories import invoice_repository
from schemas.ai import AIResponse, ReminderRunResponse, ValidateInvoiceResponse


class AILogEntry(BaseModel):
    id: uuid.UUID
    agent_type: str
    invoice_id: uuid.UUID | None
    actor_id: uuid.UUID | None
    prompt_summary: str | None
    response_text: str | None
    is_fallback: bool
    latency_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _to_ai_response(result, agent_type: AIAgentType) -> AIResponse:
    return AIResponse(
        text=result.text,
        agent_type=agent_type.value,
        is_fallback=result.is_fallback,
        latency_ms=result.latency_ms,
    )


async def _get_accessible_invoice(db: AsyncSession, invoice_id: uuid.UUID, current_user: User):
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if (
        invoice.freelancer_id != current_user.id
        and invoice.client_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return invoice


@router.post("/invoices/{invoice_id}/summarize", response_model=AIResponse)
async def summarize_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await _get_accessible_invoice(db, invoice_id, current_user)
    result = await invoice_agent.summarize(invoice, db=db, actor_id=current_user.id)
    return _to_ai_response(result, AIAgentType.INVOICE_AGENT)


@router.post("/invoices/{invoice_id}/explain", response_model=AIResponse)
async def explain_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await _get_accessible_invoice(db, invoice_id, current_user)
    result = await invoice_agent.explain_to_client(invoice, db=db, actor_id=current_user.id)
    return _to_ai_response(result, AIAgentType.INVOICE_AGENT)


@router.post("/invoices/{invoice_id}/validate", response_model=ValidateInvoiceResponse)
async def validate_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await _get_accessible_invoice(db, invoice_id, current_user)
    result = await invoice_agent.validate(invoice, db=db, actor_id=current_user.id)
    return ValidateInvoiceResponse(
        is_complete=result["is_complete"],
        missing_fields=result["missing_fields"],
        issues=result["issues"],
        suggestions=result["suggestions"],
        ai_response=_to_ai_response(result["ai_response"], AIAgentType.INVOICE_AGENT),
    )


@router.post("/invoices/{invoice_id}/suggest-terms", response_model=AIResponse)
async def suggest_payment_terms(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await _get_accessible_invoice(db, invoice_id, current_user)
    result = await invoice_agent.suggest_terms(invoice, db=db, actor_id=current_user.id)
    return _to_ai_response(result, AIAgentType.INVOICE_AGENT)


@router.get("/logs", response_model=list[AILogEntry])
async def get_ai_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AIAgentLog).order_by(AIAgentLog.created_at.desc()).limit(limit)
    if current_user.role != UserRole.ADMIN:
        query = query.where(AIAgentLog.actor_id == current_user.id)
    result = await db.execute(query)
    return [AILogEntry.model_validate(row) for row in result.scalars().all()]


@router.post("/suggest-invoice", response_model=AIResponse)
async def suggest_invoice(
    current_user: User = Depends(get_current_user),
):
    return AIResponse(
        text="To create a strong invoice: add a clear title, break work into specific line items with quantities, set a due date 14–30 days out, and include your payment terms (e.g. Net 14). Make sure the client email matches a registered user.",
        agent_type="INVOICE_AGENT",
        is_fallback=True,
        latency_ms=0,
    )


@router.post("/reminders/run", response_model=ReminderRunResponse)
async def run_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    stats = await reminder_agent.run_all(db)
    return ReminderRunResponse(**stats)
