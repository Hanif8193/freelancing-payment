import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from database import get_db
from models.invoice import InvoiceStatus
from models.user import User, UserRole
from repositories import invoice_repository
from schemas.invoice import (
    AuditEntryResponse,
    CreateInvoiceRequest,
    InvoiceListResponse,
    InvoiceResponse,
    RejectRequest,
    UpdateInvoiceRequest,
)
from services import invoice_service

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    status: InvoiceStatus | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await invoice_repository.get_by_user(db, current_user.id, status, page, limit)
    return InvoiceListResponse(items=[InvoiceResponse.model_validate(i) for i in items], total=total, page=page, limit=limit)


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    req: CreateInvoiceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    if current_user.role != UserRole.FREELANCER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can create invoices")
    invoice = await invoice_service.create_invoice(db, req, current_user)
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if invoice.freelancer_id != current_user.id and invoice.client_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return InvoiceResponse.model_validate(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: uuid.UUID,
    req: UpdateInvoiceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await invoice_service.update_invoice(db, invoice_id, req, current_user)
    return InvoiceResponse.model_validate(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await invoice_service.delete_invoice(db, invoice_id, current_user)


@router.post("/{invoice_id}/submit", response_model=InvoiceResponse)
async def submit_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await invoice_service.submit_invoice(db, invoice_id, current_user)
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/approve", response_model=InvoiceResponse)
async def approve_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await invoice_service.approve_invoice(db, invoice_id, current_user)
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/reject", response_model=InvoiceResponse)
async def reject_invoice(
    invoice_id: uuid.UUID,
    req: RejectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invoice = await invoice_service.reject_invoice(db, invoice_id, current_user, req.reason)
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}/audit", response_model=list[AuditEntryResponse])
async def get_audit_trail(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if invoice.freelancer_id != current_user.id and invoice.client_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    entries = await invoice_repository.get_audit_trail(db, invoice_id)
    return [
        AuditEntryResponse(
            id=e.id,
            invoice_id=e.invoice_id,
            actor_id=e.actor_id,
            actor_name=e.actor.full_name if e.actor else None,
            prev_status=e.prev_status,
            new_status=e.new_status,
            note=e.note,
            created_at=e.created_at,
        )
        for e in entries
    ]
