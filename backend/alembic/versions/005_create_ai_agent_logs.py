"""create ai_agent_logs table

Revision ID: 005
Revises: 003
Create Date: 2026-06-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_agent_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_type", sa.Text(), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("prompt_summary", sa.Text(), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("is_fallback", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_agent_logs_agent_type", "ai_agent_logs", ["agent_type"])
    op.create_index("ix_ai_agent_logs_invoice_id", "ai_agent_logs", ["invoice_id"])
    op.create_index("ix_ai_agent_logs_created_at", "ai_agent_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_ai_agent_logs_created_at", table_name="ai_agent_logs")
    op.drop_index("ix_ai_agent_logs_invoice_id", table_name="ai_agent_logs")
    op.drop_index("ix_ai_agent_logs_agent_type", table_name="ai_agent_logs")
    op.drop_table("ai_agent_logs")
