import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base_agent import AgentResult, BaseAgent
from models.ai_log import AIAgentType
from models.invoice import Invoice, InvoiceStatus
from models.notification import NotificationType
from repositories import invoice_repository
from services.notification_service import create_notification


class ReminderAgent(BaseAgent):

    async def generate_due_reminder(
        self,
        invoice: Invoice,
        db: AsyncSession | None = None,
    ) -> AgentResult:
        days_until_due = (invoice.due_date - date.today()).days if invoice.due_date else 0
        context = (
            f"Invoice: {invoice.title}\n"
            f"Amount Due: {invoice.total_amount} USDC\n"
            f"Due In: {days_until_due} day(s)\n"
            f"Freelancer: {invoice.freelancer.full_name}\n"
            f"Client: {invoice.client.full_name}"
        )
        return await self.call(
            system_prompt=(
                "You are an AI assistant sending a payment reminder on behalf of a freelancer. "
                "Write a polite, professional reminder message to the client about an upcoming invoice payment. "
                "Mention the amount, due date, and keep it friendly. Under 80 words."
            ),
            user_content=context,
            agent_type=AIAgentType.REMINDER_AGENT,
            max_tokens=160,
            db=db,
            invoice_id=invoice.id,
        )

    async def generate_overdue_followup(
        self,
        invoice: Invoice,
        db: AsyncSession | None = None,
    ) -> AgentResult:
        days_overdue = (date.today() - invoice.due_date).days if invoice.due_date else 0
        context = (
            f"Invoice: {invoice.title}\n"
            f"Amount Overdue: {invoice.total_amount} USDC\n"
            f"Days Overdue: {days_overdue}\n"
            f"Freelancer: {invoice.freelancer.full_name}\n"
            f"Client: {invoice.client.full_name}"
        )
        return await self.call(
            system_prompt=(
                "You are an AI assistant helping a freelancer follow up on an overdue invoice. "
                "Write a firm but professional follow-up message to the client. "
                "Acknowledge the delay without being aggressive. Under 100 words."
            ),
            user_content=context,
            agent_type=AIAgentType.REMINDER_AGENT,
            max_tokens=200,
            db=db,
            invoice_id=invoice.id,
        )

    async def run_all(self, db: AsyncSession) -> dict:
        due_soon = await invoice_repository.get_due_soon(db, days=3)
        overdue = await invoice_repository.get_overdue_candidates(db)

        sent_reminders = 0
        sent_overdue = 0

        for invoice in due_soon:
            result = await self.generate_due_reminder(invoice, db=db)
            await create_notification(
                db,
                invoice.client_id,
                NotificationType.REMINDER,
                result.text,
                invoice.id,
            )
            sent_reminders += 1

        for invoice in overdue:
            result = await self.generate_overdue_followup(invoice, db=db)
            await create_notification(
                db,
                invoice.freelancer_id,
                NotificationType.REMINDER,
                result.text,
                invoice.id,
            )
            sent_overdue += 1

        return {"due_reminders_sent": sent_reminders, "overdue_followups_sent": sent_overdue}


reminder_agent = ReminderAgent()
