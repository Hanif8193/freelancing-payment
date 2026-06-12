import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from database import get_db
from models.user import User
from repositories import transaction_repository
from schemas.payment import PaymentInitiateResponse, TransactionResponse
from services import payment_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/{invoice_id}/pay", response_model=PaymentInitiateResponse)
async def initiate_payment(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await payment_service.initiate_payment(db, invoice_id, current_user)
    return PaymentInitiateResponse(
        transaction=TransactionResponse.model_validate(tx),
        message=f"Payment of {tx.amount} USDC initiated successfully.",
    )


@router.get("/{invoice_id}/transaction", response_model=TransactionResponse)
async def get_invoice_transaction(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await payment_service.get_transaction(db, invoice_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transaction found for this invoice")
    return TransactionResponse.model_validate(tx)


@router.get("", response_model=list[TransactionResponse])
async def list_my_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, _ = await payment_service.list_user_transactions(db, current_user.id, page, limit)
    return [TransactionResponse.model_validate(t) for t in items]


@router.get("/{invoice_id}/receipt/pdf")
async def download_receipt(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await payment_service.get_transaction(db, invoice_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transaction found")

    from services.pdf_service import generate_receipt_pdf
    pdf_bytes = generate_receipt_pdf(
        receipt_id=str(tx.id)[:8].upper(),
        invoice_title=tx.invoice.title if tx.invoice else str(invoice_id)[:8],
        invoice_id=str(invoice_id),
        amount=float(tx.amount),
        payer_name=tx.payer.full_name,
        payer_wallet=tx.payer_wallet or "",
        payee_name=tx.payee.full_name,
        payee_wallet=tx.payee_wallet or "",
        tx_hash=tx.tx_hash or "",
        confirmed_at=tx.confirmed_at.strftime("%B %d, %Y %H:%M UTC") if tx.confirmed_at else "",
        ai_receipt=tx.ai_receipt,
    )

    is_pdf = pdf_bytes[:4] == b"%PDF"
    media_type = "application/pdf" if is_pdf else "text/html"
    ext = "pdf" if is_pdf else "html"
    return Response(
        content=pdf_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="receipt-{str(invoice_id)[:8]}.{ext}"'},
    )
