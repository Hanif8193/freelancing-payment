# System Architecture — AI Freelancer Payment Agent

## Overview

Three-tier web application with AI-augmented invoice and payment workflows, settled on Arc Testnet via USDC.

---

## System Diagram

```
Browser (Next.js 15)
│
│  HTTPS / REST (Axios + JWT Bearer token)
▼
FastAPI Backend (Python 3.12)
├── /api/auth          JWT register/login, user profile
├── /api/invoices      CRUD + status machine (DRAFT→PENDING→APPROVED→SETTLED)
├── /api/ai            Claude-powered: summarize, explain, validate, suggest-terms
├── /api/payments      Circle transfer initiation, transaction records, PDF receipt
├── /api/notifications Bell notifications (unread count, mark-read)
├── /api/dashboard     Role-specific metrics (single efficient query)
└── /api/admin         User management, platform-wide transaction monitor
│
├── PostgreSQL (async via asyncpg + SQLAlchemy 2)
│   ├── users           email, password_hash, role, wallet_address
│   ├── invoices        JSONB line_items, status, freelancer_id, client_id
│   ├── invoice_audit_entries  full status-change history
│   ├── notifications   per-user bell notifications
│   ├── transactions    Circle transfer ID, tx_hash, amount, USDC, status
│   └── ai_agent_logs   every Claude call: agent_type, latency, is_fallback
│
├── Anthropic Claude API (claude-sonnet-4-6)
│   ├── InvoiceAgent    summarize / explain_to_client / validate / suggest_terms
│   ├── FinanceAgent    generate_receipt / recommend_payment_schedule
│   └── ReminderAgent   due_reminder / overdue_followup / run_all
│
└── Circle Developer Controlled Wallets (Arc Testnet)
    ├── create_wallet()       called at user registration
    ├── transfer_usdc()       called on "Pay Now"
    └── CIRCLE_SIMULATE=true  offline mode (fake 0xSIM... addresses)
```

---

## Invoice State Machine

```
DRAFT ──────────────────► PENDING_APPROVAL
  │                              │
  │ (freelancer edits/deletes)   ├──► APPROVED ──► SETTLED
  │                              │
  └──────────────────────────────► REJECTED

APPROVED ──────────────────────► OVERDUE  (auto, via reminder_agent.run_all)
```

Valid transitions enforced in `backend/models/invoice.py` via `VALID_TRANSITIONS` dict.

---

## AI Agent Architecture

```
BaseAgent (backend/agents/base_agent.py)
│  - anthropic.Anthropic client (sync SDK, 30s timeout)
│  - call(system, user, agent_type, max_tokens, db, invoice_id, actor_id)
│  - catches ALL exceptions → AgentResult(is_fallback=True)
│  - logs every call to ai_agent_logs table
│
├── InvoiceAgent
│   ├── summarize(invoice)          → 2-3 sentence professional summary
│   ├── explain_to_client(invoice)  → plain-language client explanation
│   ├── validate(invoice)           → JSON {is_complete, issues, suggestions}
│   └── suggest_terms(invoice)      → payment term recommendation
│
├── FinanceAgent
│   ├── generate_receipt(tx, invoice, ...)  → receipt text for PDF
│   └── recommend_payment_schedule(invoice) → installment suggestion
│
└── ReminderAgent
    ├── generate_due_reminder(invoice)      → polite 3-day reminder
    ├── generate_overdue_followup(invoice)  → overdue follow-up
    └── run_all(db)  → queries due_soon + overdue → creates notifications
```

**Fallback behaviour:** If `ANTHROPIC_API_KEY` is empty or the API call fails for any reason, `is_fallback=True` is returned and a canned message is displayed. The payment/approval workflow is never blocked by AI availability.

---

## Payment Flow

```
Client clicks "Pay Now"
  │
  ▼
POST /api/payments/{invoice_id}/pay
  │
  ├─ Validate invoice.status == APPROVED
  ├─ Check no existing CONFIRMED transaction
  ├─ blockchain_service.transfer_usdc(payer_wallet, payee_wallet, amount)
  │     CIRCLE_SIMULATE=true  → fake tx_hash, status=CONFIRMED
  │     CIRCLE_SIMULATE=false → Circle POST /v1/w3s/transactions/transfer
  │
  ├─ Create Transaction record (CONFIRMED or PENDING)
  │
  └─ _settle_invoice():
       ├─ invoice.status → SETTLED
       ├─ audit entry: "Paid X USDC — tx: 0x..."
       ├─ finance_agent.generate_receipt() → ai_receipt stored on transaction
       └─ SETTLEMENT notifications → freelancer + client
```

---

## Frontend Route Map

```
/ → redirect to /dashboard

(auth group — no sidebar)
├── /login
└── /register

(dashboard group — auth guarded, Sidebar + Header)
├── /dashboard              real metrics + recent invoices
├── /invoices               list with status filter + pagination
├── /invoices/new           InvoiceForm (freelancer only)
├── /invoices/[id]          detail + AI panels + action buttons + audit trail
├── /transactions           user transaction history
├── /admin                  admin metrics (ADMIN only)
├── /admin/users            user management table
└── /admin/transactions     platform-wide transaction monitor
```

---

## Security Notes

- Passwords hashed with bcrypt (passlib, cost=12)
- JWT signed with HS256; 24h expiry; decoded on every protected request
- Role-based access: `require_roles(UserRole.ADMIN)` dependency
- Invoice ownership enforced in service layer (`_get_owned_invoice`, `_get_assigned_client_invoice`)
- All secrets in `.env` — never committed, never in frontend code
- CORS restricted to `localhost:3000` + production frontend origin
- Circle API called server-side only; frontend never touches API keys
