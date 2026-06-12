import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.invoice import Invoice, InvoiceStatus, VALID_TRANSITIONS
from models.notification import NotificationType
from models.user import User
from repositories import invoice_repository
from schemas.invoice import CreateInvoiceRequest, UpdateInvoiceRequest
from services.notification_service import create_notification


def _compute_total(line_items: list) -> float:
    return round(sum(item.quantity * item.unit_price for item in line_items), 6)


async def create_invoice(db: AsyncSession, req: CreateInvoiceRequest, freelancer: User) -> Invoice:
    if freelancer.id == req.client_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create invoice for yourself")

    items = [item.model_dump() for item in req.line_items]
    for item in items:
        item["total"] = round(item["quantity"] * item["unit_price"], 6)

    invoice_data = {
        "title": req.title,
        "line_items": items,
        "total_amount": _compute_total(req.line_items),
        "due_date": req.due_date,
        "payment_terms": req.payment_terms,
        "freelancer_id": freelancer.id,
        "client_id": req.client_id,
    }
    invoice = await invoice_repository.create(db, invoice_data)
    await invoice_repository.add_audit_entry(db, invoice.id, freelancer.id, None, InvoiceStatus.DRAFT.value, "Invoice created")
    return invoice


async def update_invoice(db: AsyncSession, invoice_id: uuid.UUID, req: UpdateInvoiceRequest, actor: User) -> Invoice:
    invoice = await _get_owned_invoice(db, invoice_id, actor.id)
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only DRAFT invoices can be edited")

    updates: dict = {}
    if req.title is not None:
        updates["title"] = req.title
    if req.line_items is not None:
        items = [item.model_dump() for item in req.line_items]
        for item in items:
            item["total"] = round(item["quantity"] * item["unit_price"], 6)
        updates["line_items"] = items
        updates["total_amount"] = _compute_total(req.line_items)
    if req.due_date is not None:
        updates["due_date"] = req.due_date
    if req.payment_terms is not None:
        updates["payment_terms"] = req.payment_terms
    if req.client_id is not None:
        updates["client_id"] = req.client_id

    return await invoice_repository.update(db, invoice_id, updates)


async def delete_invoice(db: AsyncSession, invoice_id: uuid.UUID, actor: User) -> None:
    invoice = await _get_owned_invoice(db, invoice_id, actor.id)
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only DRAFT invoices can be deleted")
    await invoice_repository.delete(db, invoice_id)


async def submit_invoice(db: AsyncSession, invoice_id: uuid.UUID, actor: User) -> Invoice:
    invoice = await _get_owned_invoice(db, invoice_id, actor.id)
    _assert_transition(invoice, InvoiceStatus.PENDING_APPROVAL)

    await invoice_repository.update(db, invoice_id, {"status": InvoiceStatus.PENDING_APPROVAL})
    await invoice_repository.add_audit_entry(db, invoice_id, actor.id, InvoiceStatus.DRAFT.value, InvoiceStatus.PENDING_APPROVAL.value, "Submitted for approval")
    await create_notification(db, invoice.client_id, NotificationType.APPROVAL_REQUEST, f"Invoice '{invoice.title}' from {invoice.freelancer.full_name} requires your approval.", invoice_id)

    return await invoice_repository.get_by_id(db, invoice_id)


async def approve_invoice(db: AsyncSession, invoice_id: uuid.UUID, actor: User) -> Invoice:
    invoice = await _get_assigned_client_invoice(db, invoice_id, actor.id)
    _assert_transition(invoice, InvoiceStatus.APPROVED)

    await invoice_repository.update(db, invoice_id, {"status": InvoiceStatus.APPROVED})
    await invoice_repository.add_audit_entry(db, invoice_id, actor.id, InvoiceStatus.PENDING_APPROVAL.value, InvoiceStatus.APPROVED.value, "Approved by client")
    await create_notification(db, invoice.freelancer_id, NotificationType.STATUS_CHANGE, f"Your invoice '{invoice.title}' has been approved. Ready for payment.", invoice_id)

    return await invoice_repository.get_by_id(db, invoice_id)


async def reject_invoice(db: AsyncSession, invoice_id: uuid.UUID, actor: User, reason: str) -> Invoice:
    invoice = await _get_assigned_client_invoice(db, invoice_id, actor.id)
    _assert_transition(invoice, InvoiceStatus.REJECTED)

    await invoice_repository.update(db, invoice_id, {"status": InvoiceStatus.REJECTED})
    await invoice_repository.add_audit_entry(db, invoice_id, actor.id, InvoiceStatus.PENDING_APPROVAL.value, InvoiceStatus.REJECTED.value, reason)
    await create_notification(db, invoice.freelancer_id, NotificationType.STATUS_CHANGE, f"Your invoice '{invoice.title}' was rejected. Reason: {reason}", invoice_id)

    return await invoice_repository.get_by_id(db, invoice_id)


async def mark_overdue(db: AsyncSession, invoice_id: uuid.UUID) -> Invoice:
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if invoice:
        await invoice_repository.update(db, invoice_id, {"status": InvoiceStatus.OVERDUE})
        await invoice_repository.add_audit_entry(db, invoice_id, invoice.client_id, InvoiceStatus.APPROVED.value, InvoiceStatus.OVERDUE.value, "Automatically marked overdue")
    return invoice


# --- helpers ---

async def _get_owned_invoice(db: AsyncSession, invoice_id: uuid.UUID, user_id: uuid.UUID) -> Invoice:
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if invoice.freelancer_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the invoice owner")
    return invoice


async def _get_assigned_client_invoice(db: AsyncSession, invoice_id: uuid.UUID, user_id: uuid.UUID) -> Invoice:
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if invoice.client_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the assigned client for this invoice")
    return invoice


def _assert_transition(invoice: Invoice, target: InvoiceStatus) -> None:
    allowed = VALID_TRANSITIONS.get(invoice.status, [])
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transition from {invoice.status.value} to {target.value}",
        )
