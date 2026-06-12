from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from database import get_db
from models.invoice import Invoice, InvoiceStatus
from models.notification import Notification
from models.transaction import Transaction, TransactionStatus
from models.user import User, UserRole

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


async def _compute_metrics(current_user: User, db: AsyncSession) -> dict:
    if current_user.role == UserRole.FREELANCER:
        total = (await db.execute(
            select(func.count()).select_from(Invoice).where(Invoice.freelancer_id == current_user.id)
        )).scalar_one()
        pending = (await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.freelancer_id == current_user.id,
                Invoice.status == InvoiceStatus.PENDING_APPROVAL,
            )
        )).scalar_one()
        overdue = (await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.freelancer_id == current_user.id,
                Invoice.status == InvoiceStatus.OVERDUE,
            )
        )).scalar_one()
        earned_row = (await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.payee_id == current_user.id,
                Transaction.status == TransactionStatus.CONFIRMED,
            )
        )).scalar_one()
        unread = (await db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.recipient_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            )
        )).scalar_one()
        return {
            "role": "FREELANCER",
            "total_invoices": total,
            "pending_approval": pending,
            "overdue": overdue,
            "total_earned_usdc": float(earned_row),
            "unread_notifications": unread,
        }

    elif current_user.role == UserRole.CLIENT:
        total = (await db.execute(
            select(func.count()).select_from(Invoice).where(Invoice.client_id == current_user.id)
        )).scalar_one()
        to_approve = (await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.client_id == current_user.id,
                Invoice.status == InvoiceStatus.PENDING_APPROVAL,
            )
        )).scalar_one()
        approved = (await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.client_id == current_user.id,
                Invoice.status == InvoiceStatus.APPROVED,
            )
        )).scalar_one()
        paid_row = (await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.payer_id == current_user.id,
                Transaction.status == TransactionStatus.CONFIRMED,
            )
        )).scalar_one()
        unread = (await db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.recipient_id == current_user.id,
                Notification.is_read == False,  # noqa: E712
            )
        )).scalar_one()
        return {
            "role": "CLIENT",
            "total_invoices": total,
            "invoices_to_approve": to_approve,
            "approved_awaiting_payment": approved,
            "total_paid_usdc": float(paid_row),
            "unread_notifications": unread,
        }

    else:  # ADMIN
        total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
        total_invoices = (await db.execute(select(func.count()).select_from(Invoice))).scalar_one()
        total_tx = (await db.execute(select(func.count()).select_from(Transaction))).scalar_one()
        volume_row = (await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.status == TransactionStatus.CONFIRMED
            )
        )).scalar_one()
        return {
            "role": "ADMIN",
            "total_users": total_users,
            "total_invoices": total_invoices,
            "total_transactions": total_tx,
            "total_volume_usdc": float(volume_row),
        }


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _compute_metrics(current_user, db)


@router.get("/metrics")
async def get_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _compute_metrics(current_user, db)
