# Data Model: AI Freelancer Payment Agent

**Branch**: `001-ai-payment-agent` | **Date**: 2026-06-12

---

## Entity Relationship Overview

```
users (1) ──────< invoices (N)          [freelancer_id]
users (1) ──────< invoices (N)          [client_id]
invoices (1) ───< invoice_audit_entries (N)
invoices (1) ────( transactions (1)      [UNIQUE]
invoices (1) ───< ai_agent_logs (N)
invoices (1) ───< reminder_logs (N)
users (1) ──────< notifications (N)
users (1) ──────< reminder_logs (N)
users (1) ──────< invoice_audit_entries (N)   [actor_id]
```

---

## Entity 1: User

**Purpose**: Represents a platform participant — freelancer, client, or admin.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | Generated server-side |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Lowercased on write |
| password_hash | TEXT | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | |
| role | ENUM | NOT NULL | FREELANCER / CLIENT / ADMIN |
| bio | TEXT | nullable | Optional profile bio |
| wallet_address | VARCHAR(255) | nullable | Circle wallet address; set post-registration |
| is_active | BOOLEAN | DEFAULT TRUE | Set false to deactivate account |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | Auto-updated on write |

**Validation Rules**:
- `email` must match RFC 5322 format
- `password` (raw) must be 8+ chars with at least one number
- `role` must be one of the defined ENUM values
- `full_name` must be 2–100 characters

**Indexes**: `email` (unique), `role` (for admin queries)

---

## Entity 2: Invoice

**Purpose**: A payment request from a freelancer to a client, with a defined lifecycle.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| title | VARCHAR(500) | NOT NULL | Short description of the work |
| line_items | JSONB | NOT NULL | Array of `{description, quantity, unit_price}` |
| total_amount | DECIMAL(18,6) | NOT NULL, > 0 | Sum of line item totals |
| currency | VARCHAR(10) | DEFAULT 'USDC' | Always USDC for MVP |
| due_date | DATE | NOT NULL | Must be >= today on creation |
| payment_terms | TEXT | nullable | e.g., "Net 30", "Due on receipt" |
| status | ENUM | DEFAULT 'DRAFT' | See state machine below |
| freelancer_id | UUID | FK → users.id, NOT NULL | Must have role FREELANCER |
| client_id | UUID | FK → users.id, NOT NULL | Must have role CLIENT |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Line Items JSONB Schema**:
```json
[
  {
    "description": "Website design",
    "quantity": 1,
    "unit_price": 500.00,
    "total": 500.00
  }
]
```

**Invoice Status Machine**:
```
DRAFT
  └──[submit]──> PENDING_APPROVAL
                    ├──[approve]──> APPROVED
                    │                  ├──[pay]──> SETTLED
                    │                  └──[due_date passes]──> OVERDUE
                    └──[reject]──> REJECTED
```

**Validation Rules**:
- `total_amount` must equal the sum of all `line_items[].total`
- `due_date` must be >= today on creation
- `freelancer_id != client_id` (cannot invoice yourself)
- Status transitions must follow the state machine; invalid transitions return 422

**Indexes**: `freelancer_id`, `client_id`, `status`, `due_date`

---

## Entity 3: InvoiceAuditEntry

**Purpose**: Immutable record of every invoice status change. Enables complete audit trail.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| invoice_id | UUID | FK → invoices.id, NOT NULL | |
| actor_id | UUID | FK → users.id, NOT NULL | Who made the change |
| prev_status | VARCHAR(50) | nullable | NULL for initial DRAFT creation |
| new_status | VARCHAR(50) | NOT NULL | |
| note | TEXT | nullable | Rejection reason, or optional note |
| created_at | TIMESTAMP | DEFAULT NOW() | Immutable — never updated |

**Validation Rules**:
- Records are INSERT-only; no UPDATE or DELETE allowed
- `actor_id` must match the authorized actor for the transition (e.g., only client can approve)

**Indexes**: `invoice_id`, `created_at`

---

## Entity 4: Transaction

**Purpose**: Records a USDC payment attempt on Arc Testnet, linked 1:1 to an invoice.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| invoice_id | UUID | FK → invoices.id, UNIQUE | One transaction per invoice |
| sender_wallet | VARCHAR(255) | NOT NULL | Client's Circle wallet address |
| receiver_wallet | VARCHAR(255) | NOT NULL | Freelancer's Circle wallet address |
| amount | DECIMAL(18,6) | NOT NULL | USDC amount (6 decimal places) |
| currency | VARCHAR(10) | DEFAULT 'USDC' | |
| tx_hash | VARCHAR(255) | nullable | Set when Arc Testnet confirms |
| status | ENUM | DEFAULT 'PENDING' | PENDING / CONFIRMED / FAILED |
| circle_transfer_id | VARCHAR(255) | nullable | Circle API transfer ID for polling |
| initiated_at | TIMESTAMP | DEFAULT NOW() | |
| settled_at | TIMESTAMP | nullable | Set when status → CONFIRMED |

**Validation Rules**:
- Only one transaction per invoice (UNIQUE on `invoice_id`)
- `amount` must equal `invoice.total_amount`
- Once CONFIRMED, record is immutable

**Indexes**: `invoice_id` (unique), `status`

---

## Entity 5: AIAgentLog

**Purpose**: Tracks every AI agent invocation for transparency, debugging, and the hackathon demo.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| agent_type | ENUM | NOT NULL | INVOICE / REMINDER / FINANCE |
| invoice_id | UUID | FK → invoices.id, nullable | Null for general finance agent calls |
| user_id | UUID | FK → users.id, NOT NULL | Who triggered the agent |
| input_summary | TEXT | nullable | Truncated context sent to model |
| output_text | TEXT | NOT NULL | Full model response |
| model_used | VARCHAR(100) | nullable | e.g., "claude-sonnet-4-6" |
| latency_ms | INTEGER | nullable | Round-trip time |
| is_fallback | BOOLEAN | DEFAULT FALSE | True if fallback text was returned |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: `agent_type`, `invoice_id`, `user_id`, `created_at`

---

## Entity 6: Notification

**Purpose**: In-app notifications for status changes, reminders, and settlements.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| recipient_id | UUID | FK → users.id, NOT NULL | |
| type | ENUM | NOT NULL | REMINDER / APPROVAL_REQUEST / STATUS_CHANGE / SETTLEMENT |
| message | TEXT | NOT NULL | Human-readable notification text |
| reference_id | UUID | nullable | invoice_id or transaction_id for linking |
| is_read | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: `recipient_id`, `is_read`, `created_at`

---

## Entity 7: ReminderLog

**Purpose**: Records every reminder sent by the AI Reminder Agent. Enables audit of autonomous behavior.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, NOT NULL | |
| invoice_id | UUID | FK → invoices.id, NOT NULL | |
| recipient_id | UUID | FK → users.id, NOT NULL | |
| reminder_type | VARCHAR(100) | NOT NULL | e.g., "DUE_DATE_3DAY", "OVERDUE_FOLLOWUP" |
| message | TEXT | NOT NULL | AI-generated reminder message |
| sent_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: `invoice_id`, `recipient_id`, `sent_at`

---

## Alembic Migration Order

```
001_create_users_table.py
002_create_invoices_table.py
003_create_invoice_audit_entries_table.py
004_create_transactions_table.py
005_create_ai_agent_logs_table.py
006_create_notifications_table.py
007_create_reminder_logs_table.py
```

---

## SQLAlchemy Model Notes

- All models inherit from a `Base` with `DeclarativeBase`
- UUIDs generated via `default=uuid.uuid4` (not database-generated, for portability)
- `updated_at` uses `onupdate=func.now()` trigger
- JSONB columns use `sqlalchemy.dialects.postgresql.JSONB`
- Enums defined as Python `enum.Enum` and passed to `SQLAlchemy Enum()` type
- Relationships use `relationship()` with `lazy="selectin"` for async compatibility
