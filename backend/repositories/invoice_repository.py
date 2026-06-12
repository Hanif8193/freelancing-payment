import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.invoice import Invoice, InvoiceAuditEntry, InvoiceStatus


async def create(db: AsyncSession, data: dict[str, Any]) -> Invoice:
    invoice = Invoice(**data)
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


async def get_by_id(db: AsyncSession, invoice_id: uuid.UUID) -> Invoice | None:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    return result.scalar_one_or_none()


async def get_by_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    status: InvoiceStatus | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Invoice], int]:
    query = select(Invoice).where(or_(Invoice.freelancer_id == user_id, Invoice.client_id == user_id))
    if status:
        query = query.where(Invoice.status == status)
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()
    query = query.order_by(Invoice.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_all(db: AsyncSession, status: InvoiceStatus | None = None) -> list[Invoice]:
    query = select(Invoice)
    if status:
        query = query.where(Invoice.status == status)
    result = await db.execute(query.order_by(Invoice.created_at.desc()))
    return list(result.scalars().all())


async def update(db: AsyncSession, invoice_id: uuid.UUID, updates: dict[str, Any]) -> Invoice | None:
    invoice = await get_by_id(db, invoice_id)
    if not invoice:
        return None
    for key, value in updates.items():
        if value is not None:
            setattr(invoice, key, value)
    await db.commit()
    await db.refresh(invoice)
    return invoice


async def delete(db: AsyncSession, invoice_id: uuid.UUID) -> bool:
    invoice = await get_by_id(db, invoice_id)
    if not invoice:
        return False
    await db.delete(invoice)
    await db.commit()
    return True


async def add_audit_entry(
    db: AsyncSession,
    invoice_id: uuid.UUID,
    actor_id: uuid.UUID,
    prev_status: str | None,
    new_status: str,
    note: str | None = None,
) -> InvoiceAuditEntry:
    entry = InvoiceAuditEntry(
        invoice_id=invoice_id,
        actor_id=actor_id,
        prev_status=prev_status,
        new_status=new_status,
        note=note,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_audit_trail(db: AsyncSession, invoice_id: uuid.UUID) -> list[InvoiceAuditEntry]:
    result = await db.execute(
        select(InvoiceAuditEntry)
        .where(InvoiceAuditEntry.invoice_id == invoice_id)
        .order_by(InvoiceAuditEntry.created_at)
    )
    return list(result.scalars().all())


async def get_overdue_candidates(db: AsyncSession) -> list[Invoice]:
    from datetime import date
    result = await db.execute(
        select(Invoice).where(
            Invoice.status == InvoiceStatus.APPROVED,
            Invoice.due_date < date.today(),
        )
    )
    return list(result.scalars().all())


async def get_due_soon(db: AsyncSession, days: int = 3) -> list[Invoice]:
    from datetime import date, timedelta
    today = date.today()
    threshold = today + timedelta(days=days)
    result = await db.execute(
        select(Invoice).where(
            Invoice.status == InvoiceStatus.PENDING_APPROVAL,
            Invoice.due_date <= threshold,
            Invoice.due_date >= today,
        )
    )
    return list(result.scalars().all())
