"""create invoices and audit entries tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("line_items", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("total_amount", sa.Numeric(18, 6), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USDC"),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("payment_terms", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SETTLED", "OVERDUE", name="invoicestatus"), nullable=False, server_default="DRAFT"),
        sa.Column("freelancer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["freelancer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoices_freelancer_id", "invoices", ["freelancer_id"])
    op.create_index("ix_invoices_client_id", "invoices", ["client_id"])
    op.create_index("ix_invoices_status", "invoices", ["status"])
    op.create_index("ix_invoices_due_date", "invoices", ["due_date"])

    op.create_table(
        "invoice_audit_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prev_status", sa.String(50), nullable=True),
        sa.Column("new_status", sa.String(50), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_invoice_id", "invoice_audit_entries", ["invoice_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_invoice_id", table_name="invoice_audit_entries")
    op.drop_table("invoice_audit_entries")
    op.drop_index("ix_invoices_due_date", table_name="invoices")
    op.drop_index("ix_invoices_status", table_name="invoices")
    op.drop_index("ix_invoices_client_id", table_name="invoices")
    op.drop_index("ix_invoices_freelancer_id", table_name="invoices")
    op.drop_table("invoices")
    op.execute("DROP TYPE IF EXISTS invoicestatus")
