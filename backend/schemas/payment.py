import uuid
from datetime import datetime

from pydantic import BaseModel

from models.transaction import TransactionStatus


class UserSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    wallet_address: str | None

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    amount: float
    currency: str
    status: TransactionStatus
    circle_transfer_id: str | None
    tx_hash: str | None
    payer_wallet: str | None
    payee_wallet: str | None
    ai_receipt: str | None
    error_message: str | None
    created_at: datetime
    confirmed_at: datetime | None

    payer: UserSummary
    payee: UserSummary

    model_config = {"from_attributes": True}


class PaymentInitiateResponse(BaseModel):
    transaction: TransactionResponse
    message: str
