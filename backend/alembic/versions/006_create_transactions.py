"""create transactions table

Revision ID: 006
Revises: 005
Create Date: 2026-06-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payee_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(18, 6), nullable=False),
        sa.Column("currency", sa.Text(), nullable=False, server_default="USDC"),
        sa.Column(
            "status",
            sa.Enum("PENDING", "CONFIRMED", "FAILED", name="transactionstatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("circle_transfer_id", sa.Text(), nullable=True),
        sa.Column("tx_hash", sa.Text(), nullable=True),
        sa.Column("payer_wallet", sa.Text(), nullable=True),
        sa.Column("payee_wallet", sa.Text(), nullable=True),
        sa.Column("ai_receipt", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["payer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["payee_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_invoice_id", "transactions", ["invoice_id"])
    op.create_index("ix_transactions_payer_id", "transactions", ["payer_id"])
    op.create_index("ix_transactions_payee_id", "transactions", ["payee_id"])
    op.create_index("ix_transactions_status", "transactions", ["status"])
    op.create_index("ix_transactions_created_at", "transactions", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_transactions_created_at", table_name="transactions")
    op.drop_index("ix_transactions_status", table_name="transactions")
    op.drop_index("ix_transactions_payee_id", table_name="transactions")
    op.drop_index("ix_transactions_payer_id", table_name="transactions")
    op.drop_index("ix_transactions_invoice_id", table_name="transactions")
    op.drop_table("transactions")
    op.execute("DROP TYPE IF EXISTS transactionstatus")
