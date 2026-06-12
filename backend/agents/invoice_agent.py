import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base_agent import AgentResult, BaseAgent
from models.ai_log import AIAgentType
from models.invoice import Invoice


def _invoice_context(invoice: Invoice) -> str:
    items = "\n".join(
        f"  - {item['description']}: {item['quantity']} x ${item['unit_price']} = ${item['total']}"
        for item in invoice.line_items
    )
    return (
        f"Invoice Title: {invoice.title}\n"
        f"Freelancer: {invoice.freelancer.full_name}\n"
        f"Client: {invoice.client.full_name}\n"
        f"Status: {invoice.status.value}\n"
        f"Total Amount: ${invoice.total_amount}\n"
        f"Due Date: {invoice.due_date or 'Not specified'}\n"
        f"Payment Terms: {invoice.payment_terms or 'Not specified'}\n"
        f"Line Items:\n{items}"
    )


class InvoiceAgent(BaseAgent):

    async def summarize(
        self, invoice: Invoice, db: AsyncSession | None = None, actor_id: uuid.UUID | None = None
    ) -> AgentResult:
        return await self.call(
            system_prompt=(
                "You are an AI assistant for a freelance payment platform. "
                "Generate a clear, professional 2-3 sentence summary of this invoice that captures "
                "what work was done, who it's between, and the key payment details."
            ),
            user_content=_invoice_context(invoice),
            agent_type=AIAgentType.INVOICE_AGENT,
            max_tokens=256,
            db=db,
            invoice_id=invoice.id,
            actor_id=actor_id,
        )

    async def explain_to_client(
        self, invoice: Invoice, db: AsyncSession | None = None, actor_id: uuid.UUID | None = None
    ) -> AgentResult:
        return await self.call(
            system_prompt=(
                "You are an AI assistant helping a client understand an invoice they received. "
                "Explain what the invoice is for in plain, friendly language. Highlight the total amount due, "
                "what the line items represent, and the payment deadline if set. Keep it under 150 words."
            ),
            user_content=_invoice_context(invoice),
            agent_type=AIAgentType.INVOICE_AGENT,
            max_tokens=256,
            db=db,
            invoice_id=invoice.id,
            actor_id=actor_id,
        )

    async def validate(
        self, invoice: Invoice, db: AsyncSession | None = None, actor_id: uuid.UUID | None = None
    ) -> dict:
        missing_fields = []
        if not invoice.due_date:
            missing_fields.append("due_date")
        if not invoice.payment_terms:
            missing_fields.append("payment_terms")
        if not invoice.line_items:
            missing_fields.append("line_items")

        result = await self.call(
            system_prompt=(
                "You are an invoice quality checker. Analyze this invoice and identify any issues, "
                "ambiguities, or missing information that might cause payment delays. "
                "Respond in JSON with keys: is_complete (bool), issues (list of strings), "
                "suggestions (list of strings). Be concise."
            ),
            user_content=_invoice_context(invoice),
            agent_type=AIAgentType.INVOICE_AGENT,
            max_tokens=512,
            db=db,
            invoice_id=invoice.id,
            actor_id=actor_id,
        )

        suggestions: list[str] = []
        issues: list[str] = []
        try:
            raw = result.text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            issues = parsed.get("issues", [])
            suggestions = parsed.get("suggestions", [])
        except Exception:
            suggestions = [result.text[:300]]

        return {
            "is_complete": len(missing_fields) == 0,
            "missing_fields": missing_fields,
            "issues": issues,
            "suggestions": suggestions,
            "ai_response": result,
        }

    async def suggest_terms(
        self, invoice: Invoice, db: AsyncSession | None = None, actor_id: uuid.UUID | None = None
    ) -> AgentResult:
        return await self.call(
            system_prompt=(
                "You are a freelance business advisor. Based on this invoice's total amount and the type of work, "
                "suggest appropriate payment terms (e.g., Net 14, Net 30, 50% upfront) and briefly explain why. "
                "Keep it to 2-3 sentences."
            ),
            user_content=_invoice_context(invoice),
            agent_type=AIAgentType.INVOICE_AGENT,
            max_tokens=200,
            db=db,
            invoice_id=invoice.id,
            actor_id=actor_id,
        )


invoice_agent = InvoiceAgent()
