# Implementation Plan: AI Freelancer Payment Agent

**Branch**: `001-ai-payment-agent` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-payment-agent/spec.md`

---

## Summary

Build an AI-powered freelancer payment platform across a Next.js 15 frontend and FastAPI backend, backed by PostgreSQL. Three autonomous AI agents (Invoice, Reminder, Finance) assist users throughout the invoice-to-settlement lifecycle. USDC settlement runs on Arc Testnet via Circle Wallet APIs. The platform targets non-crypto-native users with plain-language AI output and abstracted blockchain interactions.

---

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x, Node.js 20+
- Backend: Python 3.12+

**Primary Dependencies**:
- Frontend: Next.js 15, Tailwind CSS, ShadCN UI, React Query, Axios
- Backend: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, python-jose (JWT), passlib (bcrypt), httpx (Circle API client)

**Storage**: PostgreSQL 16 (primary), no cache layer in MVP

**Testing**: pytest (backend), Jest + React Testing Library (frontend, optional for MVP)

**Target Platform**: Web (desktop + mobile responsive), deployed to Vercel (frontend) + Render/Railway (backend)

**Project Type**: Web application — separate `frontend/` and `backend/` at repo root

**Performance Goals**:
- Page loads < 3s
- AI agent responses < 10s
- Payment initiation < 5s

**Constraints**:
- 14-day delivery window
- Arc Testnet only (no mainnet)
- No email notifications in MVP (in-app only)
- No Redis/queue in MVP (synchronous AI calls)

**Scale/Scope**: Hackathon demo scale — ~10 test users, ~50 invoices, ~20 transactions

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| AI First | Three AI agents with real autonomous behavior (not cosmetic chatbot) | ✅ PASS |
| UX First | Plain-language AI output; no blockchain terminology exposed to users | ✅ PASS |
| Production Quality | Modular architecture; TypeScript everywhere; SQLAlchemy ORM; Alembic migrations | ✅ PASS |
| Security First | JWT auth; all secrets in .env; input validation via Pydantic; never expose private keys | ✅ PASS |
| Blockchain Abstraction | Circle Wallet API abstracted behind `blockchain_service.py`; no wallet details in UI | ✅ PASS |
| Architecture Rules | Frontend never calls blockchain directly; all payments through backend API | ✅ PASS |

**Verdict**: All gates pass. No violations. Proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-payment-agent/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── openapi.yaml
│   └── auth.yaml
└── tasks.md             ← Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── payments/page.tsx
│   ├── transactions/page.tsx
│   ├── admin/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   ← ShadCN components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navbar.tsx
│   ├── invoice/
│   │   ├── InvoiceCard.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceStatusBadge.tsx
│   │   └── AuditTrail.tsx
│   ├── ai/
│   │   ├── AISummaryPanel.tsx
│   │   ├── AIExplanationPanel.tsx
│   │   └── AIReceiptPanel.tsx
│   └── payment/
│       ├── PaymentButton.tsx
│       └── TransactionCard.tsx
├── features/
│   ├── auth/
│   ├── invoices/
│   ├── payments/
│   ├── dashboard/
│   └── admin/
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── invoiceService.ts
│   ├── paymentService.ts
│   └── aiService.ts
├── lib/
│   ├── utils.ts
│   └── formatters.ts
├── types/
│   ├── invoice.ts
│   ├── user.ts
│   └── payment.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local

backend/
├── api/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── invoices.py
│   │   ├── payments.py
│   │   ├── ai.py
│   │   ├── notifications.py
│   │   └── admin.py
│   └── dependencies.py
├── services/
│   ├── auth_service.py
│   ├── invoice_service.py
│   ├── payment_service.py
│   ├── notification_service.py
│   └── blockchain_service.py
├── agents/
│   ├── base_agent.py
│   ├── invoice_agent.py
│   ├── reminder_agent.py
│   └── finance_agent.py
├── models/
│   ├── user.py
│   ├── invoice.py
│   ├── transaction.py
│   ├── notification.py
│   └── ai_log.py
├── repositories/
│   ├── user_repository.py
│   ├── invoice_repository.py
│   └── transaction_repository.py
├── schemas/
│   ├── auth.py
│   ├── invoice.py
│   └── payment.py
├── tests/
│   ├── test_auth.py
│   ├── test_invoices.py
│   ├── test_payments.py
│   └── test_agents.py
├── alembic/
│   └── versions/
├── main.py
├── config.py
├── database.py
├── alembic.ini
└── .env
```

**Structure Decision**: Web application (Option 2) — separate `frontend/` (Next.js) and `backend/` (FastAPI) at repo root. Each is independently runnable. No monorepo tooling needed for MVP scope.

---

## Complexity Tracking

No constitution violations. No complexity justification required.

---

## Key Architectural Decisions

### Decision 1: Authentication — JWT (not Clerk/Auth.js)

**Chosen**: Custom JWT via FastAPI + python-jose
**Rationale**: Simpler integration with FastAPI; no third-party dependency for hackathon demo; full control over user model. Clerk adds frontend dependency complexity.
**Trade-off**: No magic link / social login. Acceptable for hackathon scope.

### Decision 2: AI Agent Orchestration — Synchronous per-request

**Chosen**: Each AI agent is called synchronously when the user triggers it (button click or post-settlement hook). No queue or background worker.
**Rationale**: Avoids Redis/Celery complexity in MVP. 10s timeout is acceptable for demo.
**Trade-off**: If Claude API is slow, user waits. Mitigated with loading states and fallbacks.

### Decision 3: Circle Wallet — One wallet per user, created at registration

**Chosen**: Circle Developer Controlled Wallets API; wallet created server-side at registration; wallet address stored in `users.wallet_address`.
**Rationale**: Simplest path for testnet demo; no user key management.
**Trade-off**: Custodial model (Circle controls wallets). Fine for testnet demo.

### Decision 4: Reminder Agent — Polling via scheduled task or manual trigger

**Chosen**: Manual trigger endpoint (`POST /api/ai/reminders/run`) for MVP demo; can be called by a cron job or demonstrated manually.
**Rationale**: No background job infrastructure (Celery, APScheduler) needed for demo.
**Trade-off**: Not truly autonomous in production sense. Demo will trigger manually to show agent behavior.

### Decision 5: No real-time updates (WebSocket)

**Chosen**: Polling / page refresh for status updates in MVP.
**Rationale**: WebSocket adds significant infrastructure complexity not justified for hackathon.
**Trade-off**: Status changes require page refresh. Acceptable for demo.

---

## Phase Execution Plan

### Phase 1 — Foundation (Days 1–3): Auth + DB + Shell UI

**Deliverables:**
- `backend/` scaffold with FastAPI, config, database.py, Alembic
- `users` table + Alembic migration
- `POST /api/auth/register`, `POST /api/auth/login` (JWT)
- JWT middleware + protected route dependency
- `frontend/` scaffold with Next.js 15, Tailwind, ShadCN
- Login page, Register page, Dashboard shell
- `authService.ts` (register, login, me)
- Sidebar + Navbar layout components

**Blocking**: All subsequent phases depend on auth and DB layer.

---

### Phase 2 — Invoice Core (Days 4–6): CRUD + Status Machine

**Deliverables:**
- `invoices`, `invoice_items`, `invoice_audit_entries` tables + migrations
- Invoice CRUD API endpoints (create, list, get, update, delete)
- Invoice status machine (DRAFT → PENDING_APPROVAL → APPROVED/REJECTED → SETTLED/OVERDUE)
- Submit / Approve / Reject endpoints
- `notifications` table + notification on status change
- `invoiceService.ts` (frontend)
- Invoice list page, create form, detail page
- Status badge components
- Audit trail component

---

### Phase 3 — AI Agents (Days 7–9): Claude Integration

**Deliverables:**
- `base_agent.py` with shared prompt/call/parse/log pattern
- `invoice_agent.py` (summarize, explain, validate, suggest-terms)
- `reminder_agent.py` (due-date check, overdue flagging, reminder log)
- `finance_agent.py` (receipt generation, payment recommendation)
- `ai_agent_logs` table + migration
- AI API endpoints (`/api/ai/invoice/{id}/summarize`, etc.)
- `aiService.ts` (frontend)
- `AISummaryPanel.tsx`, `AIExplanationPanel.tsx`, `AIReceiptPanel.tsx`
- Graceful fallback for all AI endpoints

---

### Phase 4 — Payment (Days 10–11): Circle + Arc Testnet

**Deliverables:**
- `blockchain_service.py` (Circle Wallet API: create wallet, transfer USDC)
- Wallet creation hooked to user registration
- `transactions` table + migration
- `POST /api/payments/{invoice_id}/pay` endpoint
- `GET /api/payments/{invoice_id}` and `GET /api/payments`
- Transaction record + invoice status → SETTLED on confirmed tx
- `PaymentButton.tsx`, `TransactionCard.tsx` (frontend)
- Transaction history page

---

### Phase 5 — Polish + Submission (Days 12–14)

**Deliverables:**
- Admin dashboard + user management + activity logs
- Dashboard with real metrics (totals, pending, paid)
- PDF receipt download (HTML-to-PDF)
- Mobile-responsive UI polish
- Architecture diagram
- README.md with setup guide
- 3-minute demo video

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/freelancer_payment
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

ANTHROPIC_API_KEY=your-claude-api-key

CIRCLE_API_KEY=your-circle-api-key
CIRCLE_ENTITY_SECRET=your-circle-entity-secret
ARC_TESTNET_RPC=https://...

ENVIRONMENT=development
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Risk Mitigations (from spec)

| Risk | Mitigation in Plan |
|------|-------------------|
| Circle/Arc Testnet unavailability | `blockchain_service.py` has a `SIMULATE=true` mode that returns mock tx hashes |
| Claude API latency | 10s timeout + loading states + per-endpoint fallback text |
| Scope overrun | Phase 5 admin features are first cut if time is short |
| Schema changes mid-dev | Alembic migrations from Day 1; no manual schema changes |
