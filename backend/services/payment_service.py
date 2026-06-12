import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.invoice import InvoiceStatus
from models.notification import NotificationType
from models.transaction import Transaction, TransactionStatus
from repositories import invoice_repository, transaction_repository
from services.blockchain_service import blockchain_service
from services.notification_service import create_notification


async def initiate_payment(
    db: AsyncSession,
    invoice_id: uuid.UUID,
    client_user,
) -> Transaction:
    invoice = await invoice_repository.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if invoice.client_id != client_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the assigned client")
    if invoice.status != InvoiceStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only APPROVED invoices can be paid",
        )

    existing = await transaction_repository.get_by_invoice_id(db, invoice_id)
    if existing and existing.status == TransactionStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice already has a confirmed payment",
        )

    payer_wallet = client_user.wallet_address or "0xUNKNOWN"
    payee_wallet = invoice.freelancer.wallet_address or "0xUNKNOWN"

    try:
        transfer_result = await blockchain_service.transfer_usdc(
            sender_wallet=payer_wallet,
            receiver_wallet=payee_wallet,
            amount=float(invoice.total_amount),
            invoice_id=invoice_id,
        )
        tx_status = TransactionStatus.CONFIRMED if transfer_result["status"] == "CONFIRMED" else TransactionStatus.PENDING
    except Exception as exc:
        tx_data = {
            "invoice_id": invoice_id,
            "payer_id": client_user.id,
            "payee_id": invoice.freelancer_id,
            "amount": float(invoice.total_amount),
            "currency": "USDC",
            "status": TransactionStatus.FAILED,
            "payer_wallet": payer_wallet,
            "payee_wallet": payee_wallet,
            "error_message": str(exc)[:500],
        }
        tx = await transaction_repository.create(db, tx_data)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment transfer failed: {exc}",
        ) from exc

    confirmed_at = datetime.now(timezone.utc) if tx_status == TransactionStatus.CONFIRMED else None

    tx_data = {
        "invoice_id": invoice_id,
        "payer_id": client_user.id,
        "payee_id": invoice.freelancer_id,
        "amount": float(invoice.total_amount),
        "currency": "USDC",
        "status": tx_status,
        "circle_transfer_id": transfer_result.get("transfer_id"),
        "tx_hash": transfer_result.get("tx_hash"),
        "payer_wallet": payer_wallet,
        "payee_wallet": payee_wallet,
        "confirmed_at": confirmed_at,
    }
    tx = await transaction_repository.create(db, tx_data)

    if tx_status == TransactionStatus.CONFIRMED:
        await _settle_invoice(db, invoice, tx, client_user)

    return tx


async def _settle_invoice(db, invoice, tx: Transaction, client_user) -> None:
    await invoice_repository.update(db, invoice.id, {"status": InvoiceStatus.SETTLED})
    await invoice_repository.add_audit_entry(
        db, invoice.id, client_user.id,
        InvoiceStatus.APPROVED.value, InvoiceStatus.SETTLED.value,
        f"Paid {tx.amount} USDC — tx: {tx.tx_hash}",
    )

    receipt_text: str | None = None
    try:
        from agents.finance_agent import finance_agent
        result = await finance_agent.generate_receipt(
            transaction_id=str(tx.id),
            tx_hash=tx.tx_hash or "",
            invoice_title=invoice.title,
            invoice_id=invoice.id,
            amount=float(tx.amount),
            freelancer_name=invoice.freelancer.full_name,
            client_name=invoice.client.full_name,
            settled_at=tx.confirmed_at.isoformat() if tx.confirmed_at else "",
            db=db,
        )
        receipt_text = result.text
    except Exception:
        pass

    if receipt_text:
        await transaction_repository.update_status(
            db, tx.id, TransactionStatus.CONFIRMED, {"ai_receipt": receipt_text}
        )

    await create_notification(
        db, invoice.freelancer_id, NotificationType.SETTLEMENT,
        f"Payment of {tx.amount} USDC received for invoice '{invoice.title}'. Tx: {tx.tx_hash}",
        invoice.id,
    )
    await create_notification(
        db, invoice.client_id, NotificationType.SETTLEMENT,
        f"Payment of {tx.amount} USDC sent for invoice '{invoice.title}'. Tx: {tx.tx_hash}",
        invoice.id,
    )


async def get_transaction(db: AsyncSession, invoice_id: uuid.UUID) -> Transaction | None:
    return await transaction_repository.get_by_invoice_id(db, invoice_id)


async def list_user_transactions(
    db: AsyncSession,
    user_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Transaction], int]:
    return await transaction_repository.get_by_user(db, user_id, page, limit)
