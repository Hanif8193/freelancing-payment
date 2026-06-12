import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.transaction import Transaction, TransactionStatus


def _with_relations(query):
    return query.options(
        selectinload(Transaction.payer),
        selectinload(Transaction.payee),
        selectinload(Transaction.invoice),
    )


async def create(db: AsyncSession, data: dict) -> Transaction:
    tx = Transaction(**data)
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    result = await db.execute(_with_relations(select(Transaction).where(Transaction.id == tx.id)))
    return result.scalar_one()


async def get_by_id(db: AsyncSession, tx_id: uuid.UUID) -> Transaction | None:
    result = await db.execute(_with_relations(select(Transaction).where(Transaction.id == tx_id)))
    return result.scalar_one_or_none()


async def get_by_invoice_id(db: AsyncSession, invoice_id: uuid.UUID) -> Transaction | None:
    result = await db.execute(
        _with_relations(select(Transaction).where(Transaction.invoice_id == invoice_id))
        .order_by(Transaction.created_at.desc())
    )
    return result.scalars().first()


async def update_status(
    db: AsyncSession,
    tx_id: uuid.UUID,
    status: TransactionStatus,
    updates: dict | None = None,
) -> Transaction:
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = result.scalar_one()
    tx.status = status
    if updates:
        for k, v in updates.items():
            setattr(tx, k, v)
    await db.commit()
    return await get_by_id(db, tx_id)


async def get_by_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Transaction], int]:
    from sqlalchemy import func, or_
    count_q = select(func.count()).select_from(Transaction).where(
        or_(Transaction.payer_id == user_id, Transaction.payee_id == user_id)
    )
    total = (await db.execute(count_q)).scalar_one()

    query = (
        _with_relations(
            select(Transaction).where(
                or_(Transaction.payer_id == user_id, Transaction.payee_id == user_id)
            )
        )
        .order_by(Transaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    items = list((await db.execute(query)).scalars().all())
    return items, total


async def get_all(db: AsyncSession, page: int = 1, limit: int = 50) -> tuple[list[Transaction], int]:
    from sqlalchemy import func
    total = (await db.execute(select(func.count()).select_from(Transaction))).scalar_one()
    query = (
        _with_relations(select(Transaction))
        .order_by(Transaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    items = list((await db.execute(query)).scalars().all())
    return items, total
