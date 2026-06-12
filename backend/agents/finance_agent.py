import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base_agent import AgentResult, BaseAgent
from models.ai_log import AIAgentType


class FinanceAgent(BaseAgent):

    async def generate_receipt(
        self,
        transaction_id: str,
        tx_hash: str,
        invoice_title: str,
        invoice_id: uuid.UUID,
        amount: float,
        freelancer_name: str,
        client_name: str,
        settled_at: str,
        db: AsyncSession | None = None,
    ) -> AgentResult:
        context = (
            f"Transaction ID: {transaction_id}\n"
            f"Blockchain Hash: {tx_hash}\n"
            f"Invoice: {invoice_title} (ID: {invoice_id})\n"
            f"Amount: {amount} USDC\n"
            f"From (Client): {client_name}\n"
            f"To (Freelancer): {freelancer_name}\n"
            f"Settled At: {settled_at}"
        )
        return await self.call(
            system_prompt=(
                "You are a financial assistant for a freelance payment platform. "
                "Generate a professional, concise payment receipt. Include transaction reference, "
                "parties involved, amount paid in USDC, and the blockchain confirmation hash. "
                "Format it cleanly for display. Under 200 words."
            ),
            user_content=context,
            agent_type=AIAgentType.FINANCE_AGENT,
            max_tokens=400,
            db=db,
            invoice_id=invoice_id,
        )

    async def recommend_payment_schedule(
        self,
        invoice_title: str,
        invoice_id: uuid.UUID,
        total_amount: float,
        payment_terms: str | None,
        db: AsyncSession | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> AgentResult:
        context = (
            f"Invoice: {invoice_title}\n"
            f"Total Amount: {total_amount} USDC\n"
            f"Current Payment Terms: {payment_terms or 'Not specified'}"
        )
        return await self.call(
            system_prompt=(
                "You are a financial advisor for freelancers. For this invoice, recommend whether "
                "a single payment or installment schedule makes sense. If installments, suggest a "
                "specific schedule (e.g., 50% on approval, 50% on delivery). Keep it to 3 sentences."
            ),
            user_content=context,
            agent_type=AIAgentType.FINANCE_AGENT,
            max_tokens=200,
            db=db,
            invoice_id=invoice_id,
            actor_id=actor_id,
        )


finance_agent = FinanceAgent()
