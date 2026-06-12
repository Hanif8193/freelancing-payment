import enum
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SETTLED = "SETTLED"
    OVERDUE = "OVERDUE"


VALID_TRANSITIONS: dict[InvoiceStatus, list[InvoiceStatus]] = {
    InvoiceStatus.DRAFT: [InvoiceStatus.PENDING_APPROVAL],
    InvoiceStatus.PENDING_APPROVAL: [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED],
    InvoiceStatus.APPROVED: [InvoiceStatus.SETTLED, InvoiceStatus.OVERDUE],
    InvoiceStatus.REJECTED: [],
    InvoiceStatus.SETTLED: [],
    InvoiceStatus.OVERDUE: [InvoiceStatus.SETTLED],
}


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    line_items: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USDC", nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False, index=True)
    freelancer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id], lazy="selectin")  # type: ignore[name-defined]  # noqa: F821
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id], lazy="selectin")  # type: ignore[name-defined]  # noqa: F821
    audit_entries: Mapped[list["InvoiceAuditEntry"]] = relationship("InvoiceAuditEntry", back_populates="invoice", order_by="InvoiceAuditEntry.created_at", lazy="selectin")


class InvoiceAuditEntry(Base):
    __tablename__ = "invoice_audit_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False, index=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    prev_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="audit_entries")
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_id], lazy="selectin")  # type: ignore[name-defined]  # noqa: F821
