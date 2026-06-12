import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    recipient_id: uuid.UUID,
    type: NotificationType,
    message: str,
    reference_id: uuid.UUID | None = None,
) -> Notification:
    notif = Notification(recipient_id=recipient_id, type=type, message=message, reference_id=reference_id)
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_user_notifications(db: AsyncSession, user_id: uuid.UUID, unread_only: bool = False) -> list[Notification]:
    query = select(Notification).where(Notification.recipient_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa: E712
    result = await db.execute(query.order_by(Notification.created_at.desc()))
    return list(result.scalars().all())


async def mark_read(db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification | None:
    result = await db.execute(select(Notification).where(Notification.id == notification_id, Notification.recipient_id == user_id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
        await db.refresh(notif)
    return notif
