# Research: AI Freelancer Payment Agent

**Branch**: `001-ai-payment-agent` | **Date**: 2026-06-12
**Purpose**: Resolve all NEEDS CLARIFICATION items and capture technology decisions before implementation.

---

## 1. Authentication Strategy

**Decision**: Custom JWT using FastAPI + `python-jose` + `passlib[bcrypt]`

**Rationale**:
- Clerk requires a Next.js middleware + external service dependency; adds setup complexity for hackathon
- Auth.js (NextAuth) is frontend-only and doesn't integrate cleanly with a separate FastAPI backend
- Custom JWT gives full control over user model, token expiry, and role claims
- `python-jose` + `passlib` are production-grade, well-documented libraries

**Alternatives considered**:
- Clerk: Best UX but external SaaS dependency, harder to demo offline
- Auth.js: Frontend-only, needs separate backend session management
- Firebase Auth: Another external dependency; overkill for MVP

**Implementation notes**:
- Access tokens expire in 24h (1440 minutes) — long enough for demo, short enough to be secure
- Token payload: `{ sub: user_id, role: "FREELANCER"|"CLIENT"|"ADMIN", exp: ... }`
- `get_current_user` FastAPI dependency injected into all protected routes

---

## 2. Circle Wallet API + Arc Testnet Integration

**Decision**: Circle Developer Controlled Wallets (server-side custodial wallets)

**Rationale**:
- Arc Testnet is built on Circle's Cross-Chain Transfer Protocol (CCTP) infrastructure
- Developer Controlled Wallets allow server-side wallet creation without user key management
- Circle's API provides: create wallet set, create wallet, transfer USDC, get transaction status
- USDC on Arc Testnet is test USDC — no real funds

**Circle API flow**:
```
1. POST /wallets/walletSets       → create a wallet set (one per app)
2. POST /wallets                  → create wallet for each user (store address in DB)
3. POST /transactions/transfer    → initiate USDC transfer
4. GET  /transactions/{id}        → poll for CONFIRMED status
```

**Simulation mode**:
- If `CIRCLE_SIMULATE=true` in env, `blockchain_service.py` returns fake wallet addresses and tx hashes
- Allows demo without live Circle API credentials
- Fake tx hash format: `0xSIM-{uuid}`

**Arc Testnet specifics**:
- Network: Arc Testnet (part of Circle's CCTP testnet environment)
- Token: USDC testnet (6 decimal places)
- Testnet USDC available via Circle faucet

---

## 3. AI Agent: Claude API Integration

**Decision**: Claude API via Anthropic Python SDK (`anthropic` package)

**Model**: `claude-sonnet-4-6` (fast, capable, cost-effective for demo)

**Rationale**:
- Claude is specified in the constitution
- Anthropic SDK is straightforward; minimal setup
- `claude-sonnet-4-6` has sufficient context window for invoice data

**Agent prompt pattern** (shared via `base_agent.py`):
```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": structured_input}]
)
```

**Fallback**: If `anthropic.APIError` or timeout, return a predefined fallback string. Workflow continues.

**Per-agent system prompts**:
- Invoice Agent: "You are an expert invoicing assistant. Summarize invoices in plain English for non-technical users."
- Reminder Agent: "You are a professional payment reminder service. Write polite, clear reminder messages."
- Finance Agent: "You are a financial analyst. Generate plain-language receipts and payment insights."

---

## 4. Database: PostgreSQL + SQLAlchemy + Alembic

**Decision**: PostgreSQL 16 with SQLAlchemy 2.x (async ORM) + Alembic migrations

**Rationale**:
- PostgreSQL is specified in constitution; best support for JSONB (line items), UUID primary keys
- SQLAlchemy 2.x async mode works natively with FastAPI's async handlers
- Alembic ensures schema evolution is tracked and reversible

**Connection**:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/freelancer_payment
```

**UUID primary keys**: All tables use UUID v4 (generated server-side via `uuid.uuid4()`)

**JSONB for line items**: `invoices.line_items` stored as JSONB column — avoids a complex join for a simple nested list

---

## 5. Frontend: Next.js 15 App Router + ShadCN

**Decision**: Next.js 15 App Router with server and client components

**Patterns**:
- Server components for initial data fetching (dashboard, invoice list)
- Client components for interactive forms and real-time updates
- `services/` layer for all API calls (Axios with interceptors for auth header)
- React Query (`@tanstack/react-query`) for client-side data fetching, caching, and refetch

**ShadCN components used**:
- `Button`, `Input`, `Form`, `Table`, `Badge`, `Dialog`, `Card`, `Sidebar`, `Sheet`, `Separator`
- Installed via `npx shadcn@latest add <component>`

**Auth flow**:
- JWT stored in `localStorage` (acceptable for demo; use httpOnly cookies for production)
- `authService.ts` reads token and injects into Axios `Authorization: Bearer <token>` header
- Redirect to `/login` if 401 response received

---

## 6. Deployment Strategy

**Frontend**: Vercel
- `frontend/` directory as root
- Environment: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

**Backend**: Render or Railway (free tier)
- `backend/` directory
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- PostgreSQL: Render managed Postgres or Railway PostgreSQL plugin

---

## 7. PDF Receipt Generation

**Decision**: `weasyprint` or `reportlab` (Python) for server-side PDF generation

**Rationale**: Simple HTML template → PDF; no external service. Returns as `application/pdf` response.

**Alternative**: `pdfkit` (requires wkhtmltopdf binary — harder to install on cloud)

**Fallback**: Return JSON receipt if PDF generation fails.

---

## 8. Reminder Agent — Scheduling

**Decision**: Manual trigger endpoint for MVP; no background scheduler

**Endpoint**: `POST /api/ai/reminders/run` (admin or internal call)
**Logic**: Query all invoices where `due_date <= today + 3 days AND status = PENDING_APPROVAL` OR `due_date < today AND status = APPROVED` → generate reminder → create notification → log to `reminder_logs`

**Demo approach**: Trigger manually during demo to show autonomous agent behavior. Can be wrapped in a simple cron later.

---

## Resolved NEEDS CLARIFICATION Items

| Item | Resolution |
|------|-----------|
| Auth method | JWT (custom, FastAPI) |
| Wallet management | Circle Developer Controlled Wallets |
| AI model | Claude Sonnet via Anthropic SDK |
| Reminder scheduling | Manual trigger for MVP |
| PDF generation | weasyprint (server-side) |
| Session storage (frontend) | localStorage for demo |
| Deployment | Vercel (frontend) + Render (backend) |
| JSONB vs join for line items | JSONB (simpler for MVP) |
