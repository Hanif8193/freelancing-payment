import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, field_validator, model_validator

from models.invoice import InvoiceStatus


class LineItemSchema(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total: float | None = None

    @model_validator(mode="after")
    def compute_total(self) -> "LineItemSchema":
        self.total = round(self.quantity * self.unit_price, 6)
        return self


class CreateInvoiceRequest(BaseModel):
    title: str
    line_items: list[LineItemSchema]
    due_date: date | None = None
    payment_terms: str | None = None
    client_id: uuid.UUID

    @field_validator("line_items")
    @classmethod
    def at_least_one_item(cls, v: list) -> list:
        if not v:
            raise ValueError("At least one line item is required")
        return v

    @field_validator("title")
    @classmethod
    def non_empty_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v


class UpdateInvoiceRequest(BaseModel):
    title: str | None = None
    line_items: list[LineItemSchema] | None = None
    due_date: date | None = None
    payment_terms: str | None = None
    client_id: uuid.UUID | None = None


class AuditEntryResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    actor_id: uuid.UUID
    actor_name: str | None = None
    prev_status: str | None
    new_status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceUserSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    wallet_address: str | None = None

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    title: str
    line_items: list[dict[str, Any]]
    total_amount: float
    currency: str
    due_date: date | None
    payment_terms: str | None
    status: InvoiceStatus
    freelancer_id: uuid.UUID
    client_id: uuid.UUID
    freelancer: InvoiceUserSummary | None = None
    client: InvoiceUserSummary | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RejectRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Rejection reason must be at least 5 characters")
        return v


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    limit: int
