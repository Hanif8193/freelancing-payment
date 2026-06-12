# Tasks: AI Freelancer Payment Agent

**Input**: Design documents from `/specs/001-ai-payment-agent/`
**Branch**: `001-ai-payment-agent` | **Date**: 2026-06-12
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/openapi.yaml ✅

> **⚡ RULE**: Complete Phase 1 fully before starting Phase 2. Each phase gate must be verified.
> **[P]** = can run in parallel (different files/concerns, no dependencies)

---

## Phase 1: Foundation — Auth + DB + Shell UI (Days 1–3) 🚧 START HERE

**Goal**: Working authentication, database layer, and navigable UI shell.
**Gate**: Users can register, log in, and see a protected dashboard. Both frontend and backend run locally.

---

### Phase 1A: Repository & Project Scaffold

- [ ] **T001** Initialize monorepo structure at repo root: create `frontend/`, `backend/`, `docs/` directories; add root `.gitignore` (node_modules, .env*, __pycache__, .venv, *.pyc)
- [ ] **T002 [P]** Scaffold Next.js 15 frontend: run `npx create-next-app@15 frontend --typescript --tailwind --app --src-dir no --import-alias "@/*"` from repo root
- [ ] **T003 [P]** Scaffold FastAPI backend: create `backend/` with `requirements.txt`, `main.py`, `config.py`, `database.py`; add `backend/.env` from `.env.example`
- [ ] **T004** Install ShadCN UI in `frontend/`: run `npx shadcn@latest init` (style: default, base color: slate); install initial components: `button input label card badge separator sheet dialog`
- [ ] **T005 [P]** Create frontend folder structure: `frontend/components/ui/`, `frontend/components/layout/`, `frontend/components/invoice/`, `frontend/components/ai/`, `frontend/components/payment/`, `frontend/features/`, `frontend/services/`, `frontend/lib/`, `frontend/types/`
- [ ] **T006 [P]** Create backend folder structure: `backend/api/routes/`, `backend/api/dependencies.py`, `backend/services/`, `backend/agents/`, `backend/models/`, `backend/repositories/`, `backend/schemas/`, `backend/tests/`, `backend/alembic/`

---

### Phase 1B: Backend — Database + ORM

- [ ] **T007** Install backend Python dependencies in `backend/requirements.txt`: `fastapi==0.115.*`, `uvicorn[standard]`, `sqlalchemy[asyncio]==2.0.*`, `asyncpg`, `alembic`, `pydantic[email]==2.*`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `httpx`, `anthropic`, `python-multipart`
- [ ] **T008** Create `backend/config.py`: define `Settings` class using `pydantic-settings` with fields: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM` (default HS256), `ACCESS_TOKEN_EXPIRE_MINUTES` (default 1440), `ANTHROPIC_API_KEY`, `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_SIMULATE` (bool, default False), `ENVIRONMENT`
- [ ] **T009** Create `backend/database.py`: async SQLAlchemy engine (`create_async_engine`), `AsyncSessionLocal` factory, `Base = DeclarativeBase()`, `get_db` async dependency that yields a session
- [ ] **T010** Initialize Alembic in `backend/`: run `alembic init alembic`; update `alembic/env.py` to use async engine and import all models from `backend/models/`; set `sqlalchemy.url` to read from `config.Settings`
- [ ] **T011** Create `backend/models/user.py`: `User` SQLAlchemy model with all fields from data-model.md: `id` (UUID PK), `email` (VARCHAR 255 unique), `password_hash` (TEXT), `full_name` (VARCHAR 255), `role` (Enum: FREELANCER/CLIENT/ADMIN), `bio` (TEXT nullable), `wallet_address` (VARCHAR 255 nullable), `is_active` (Boolean default True), `created_at`, `updated_at`; add `UserRole` Python enum
- [ ] **T012** Generate Alembic migration `001_create_users_table.py`: run `alembic revision --autogenerate -m "create users table"`; verify generated migration matches data-model.md schema
- [ ] **T013** Run migration and verify: `alembic upgrade head`; connect to DB and confirm `users` table exists with all columns

---

### Phase 1C: Backend — Auth API

- [ ] **T014** Create `backend/schemas/auth.py`: Pydantic v2 schemas: `RegisterRequest` (email, password min 8 chars + number validation, full_name, role), `LoginRequest` (email, password), `TokenResponse` (access_token, token_type, user), `UserResponse` (id, email, full_name, role, bio, wallet_address, is_active, created_at)
- [ ] **T015** Create `backend/repositories/user_repository.py`: async functions: `get_by_email(db, email)`, `get_by_id(db, id)`, `create(db, user_data)`, `update(db, user_id, updates)`, `get_all(db)` — all use `AsyncSession`, return `User | None`
- [ ] **T016** Create `backend/services/auth_service.py`: `hash_password(plain)`, `verify_password(plain, hashed)` using `passlib.bcrypt`; `create_access_token(data: dict)` using `python-jose`; `decode_token(token)` → payload dict or raise 401; `register_user(db, req)` → validates email uniqueness, hashes password, calls repo; `authenticate_user(db, email, password)` → verify hash, return user or raise 401
- [ ] **T017** Create `backend/api/dependencies.py`: `get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db))` → decode JWT, load user from DB, return `User`; `require_role(*roles)` factory that returns a dependency checking `current_user.role`
- [ ] **T018** Create `backend/api/routes/auth.py`: FastAPI router with prefix `/api/auth`; `POST /register` → calls `auth_service.register_user`, returns `TokenResponse` 201; `POST /login` → calls `auth_service.authenticate_user`, creates token, returns `TokenResponse` 200; `GET /me` → returns current user (protected); `PATCH /me` → update full_name/bio (protected)
- [ ] **T019** Wire routes in `backend/main.py`: create FastAPI app; add CORS middleware with `allow_origins=["http://localhost:3000"]`, allow credentials, all methods/headers; include `auth.router`; add `/health` endpoint returning `{"status": "ok"}`
- [ ] **T020** Test auth endpoints manually with curl or HTTPie: register freelancer, register client, login, call `/api/auth/me` with token — verify all return correct responses and errors

---

### Phase 1D: Frontend — Types + API Client

- [ ] **T021** Create `frontend/types/user.ts`: TypeScript interfaces: `UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN'`, `User { id, email, full_name, role, bio, wallet_address, is_active, created_at }`, `AuthTokenResponse { access_token, token_type, user }`
- [ ] **T022** Create `frontend/lib/utils.ts`: `cn()` utility (clsx + tailwind-merge) for conditional classNames; `formatCurrency(amount, currency)` for displaying USDC amounts; `formatDate(date)` for display-friendly dates
- [ ] **T023** Create `frontend/services/api.ts`: Axios instance with `baseURL = process.env.NEXT_PUBLIC_API_URL`; request interceptor adding `Authorization: Bearer <token>` from localStorage; response interceptor catching 401 and redirecting to `/login`
- [ ] **T024** Create `frontend/services/authService.ts`: `register(data)`, `login(data)` → calls POST `/api/auth/register|login`, stores token in localStorage; `logout()` → clears localStorage; `getMe()` → GET `/api/auth/me`; `getCurrentUser()` → parse token from localStorage; `isAuthenticated()` → boolean

---

### Phase 1E: Frontend — Auth Pages

- [ ] **T025** Create `frontend/app/(auth)/layout.tsx`: centered card layout for auth pages; no sidebar; Freelancer Payment logo/title
- [ ] **T026** Create `frontend/app/(auth)/login/page.tsx`: "client component"; form with email + password inputs (ShadCN `Form`, `Input`, `Button`); calls `authService.login`; on success stores token, redirects to `/dashboard`; shows error message on failure; link to register page
- [ ] **T027** Create `frontend/app/(auth)/register/page.tsx`: form with full_name, email, password, role select (Freelancer / Client); calls `authService.register`; on success stores token, redirects to `/dashboard`; validates password on client side (min 8 chars, number); link to login page

---

### Phase 1F: Frontend — Layout + Dashboard Shell

- [ ] **T028** Create `frontend/components/layout/Sidebar.tsx`: sidebar with navigation links: Dashboard, Invoices, Payments, Transaction History, (Admin — conditional on role); shows user name + role badge at bottom; uses ShadCN `Sheet` for mobile (hamburger menu)
- [ ] **T029** Create `frontend/components/layout/Header.tsx`: top bar showing current page title; notification bell icon (placeholder); user avatar with dropdown: Profile, Logout; calls `authService.logout` and redirects to `/login` on logout
- [ ] **T030** Create `frontend/app/layout.tsx`: root layout with auth guard — reads token from localStorage; if no token, redirect to `/login`; wraps children with `Sidebar` + `Header` layout; sets `NEXT_PUBLIC_API_URL` via Next.js env
- [ ] **T031** Create `frontend/app/dashboard/page.tsx`: basic dashboard shell — 4 metric cards (Total Invoices, Pending, Paid, USDC Earned); each card shows "—" as placeholder; "Create Invoice" call-to-action button; fully typed with `User` interface; uses ShadCN `Card`

---

### Phase 1 Gate Verification ✅

- [ ] **T032** Phase 1 integration test: (a) Start backend `uvicorn main:app --reload`; (b) Start frontend `npm run dev`; (c) Open http://localhost:3000 — redirects to login; (d) Register as FREELANCER; (e) Redirected to dashboard; (f) Dashboard shows shell with user's name in header; (g) Logout → redirected to login; (h) Login again → dashboard; ✅ Phase 1 complete

---

## Phase 2: Invoice Core — CRUD + Status Machine (Days 4–6)

**Goal**: Full invoice lifecycle — create, list, view, edit, delete, submit, approve, reject with audit trail.
**Gate**: Freelancer creates and submits an invoice; client approves; audit trail shows full history.

---

### Phase 2A: Backend — Invoice Models + DB

- [ ] **T033 [P]** Create `backend/models/invoice.py`: `InvoiceStatus` enum, `Invoice` model with all fields from data-model.md; `InvoiceAuditEntry` model; relationships: `Invoice.freelancer` → User, `Invoice.client` → User, `Invoice.audit_entries` → list[InvoiceAuditEntry]
- [ ] **T034 [P]** Create `backend/models/notification.py`: `NotificationType` enum, `Notification` model from data-model.md
- [ ] **T035** Generate and run Alembic migrations for invoice tables: `002_create_invoices_table.py`, `003_create_invoice_audit_entries_table.py`, `004_create_notifications_table.py`; run `alembic upgrade head`

---

### Phase 2B: Backend — Invoice API

- [ ] **T036** Create `backend/schemas/invoice.py`: `LineItemSchema`, `CreateInvoiceRequest`, `UpdateInvoiceRequest`, `InvoiceResponse`, `AuditEntryResponse`, `RejectRequest`
- [ ] **T037** Create `backend/repositories/invoice_repository.py`: `create`, `get_by_id`, `get_by_user` (freelancer or client), `update`, `soft_delete`, `get_all` (admin), `add_audit_entry`, `get_audit_trail`
- [ ] **T038** Create `backend/services/invoice_service.py`: `create_invoice`, `update_invoice` (validate DRAFT), `delete_invoice` (validate DRAFT), `submit_invoice` (DRAFT→PENDING_APPROVAL + audit entry + notification), `approve_invoice` (PENDING→APPROVED + audit + notification), `reject_invoice` (PENDING→REJECTED + audit + notification + reason)
- [ ] **T039** Create `backend/api/routes/invoices.py`: all invoice endpoints from openapi.yaml; wire to invoice_service; protect with `get_current_user`; enforce ownership and role checks
- [ ] **T040** Add invoice router to `backend/main.py`

---

### Phase 2C: Backend — Notifications

- [ ] **T041** Create `backend/services/notification_service.py`: `create_notification(db, recipient_id, type, message, reference_id)`; `get_user_notifications(db, user_id, unread_only)` ; `mark_read(db, notification_id, user_id)`
- [ ] **T042** Create `backend/api/routes/notifications.py`: `GET /api/notifications`, `PATCH /api/notifications/{id}/read`; add to `main.py`

---

### Phase 2D: Frontend — Invoice UI

- [ ] **T043** Create `frontend/types/invoice.ts`: `InvoiceStatus`, `LineItem`, `Invoice`, `AuditEntry`, `CreateInvoiceRequest` TypeScript types matching openapi.yaml schemas
- [ ] **T044** Create `frontend/services/invoiceService.ts`: `listInvoices(params?)`, `createInvoice(data)`, `getInvoice(id)`, `updateInvoice(id, data)`, `deleteInvoice(id)`, `submitInvoice(id)`, `approveInvoice(id)`, `rejectInvoice(id, reason)`, `getAuditTrail(id)`
- [ ] **T045** Create `frontend/components/invoice/InvoiceStatusBadge.tsx`: color-coded ShadCN `Badge` for each status: DRAFT=gray, PENDING_APPROVAL=yellow, APPROVED=blue, REJECTED=red, SETTLED=green, OVERDUE=orange
- [ ] **T046** Create `frontend/components/invoice/InvoiceForm.tsx`: controlled form with title, line items (dynamic add/remove rows with description, quantity, unit_price, auto-calculated total), due_date datepicker, payment_terms textarea, client selector (fetches CLIENT users from API); validates total > 0; TypeScript-typed with `CreateInvoiceRequest`
- [ ] **T047** Create `frontend/app/invoices/new/page.tsx`: wraps `InvoiceForm`; on submit calls `invoiceService.createInvoice`; redirects to invoice detail page on success
- [ ] **T048** Create `frontend/app/invoices/page.tsx`: invoice list table using ShadCN `Table`; columns: Invoice ID (truncated), Title, Client/Freelancer, Amount (USDC), Due Date, Status badge, Actions; fetches from `invoiceService.listInvoices`; empty state with "Create Invoice" CTA
- [ ] **T049** Create `frontend/components/invoice/AuditTrail.tsx`: vertical timeline of audit entries; each entry shows: actor name, action (status change), note, timestamp; uses ShadCN `Separator`
- [ ] **T050** Create `frontend/app/invoices/[id]/page.tsx`: full invoice detail view; shows all fields, line items table, total; action buttons conditional on status and user role: Submit (freelancer, DRAFT), Approve (client, PENDING), Reject (client, PENDING), Pay Now (client, APPROVED); shows `AuditTrail` component at bottom
- [ ] **T051** Update `frontend/app/dashboard/page.tsx`: fetch real counts from invoice list API; populate metric cards with actual data

---

### Phase 2 Gate Verification ✅

- [ ] **T052** Phase 2 integration test: (a) Login as freelancer; (b) Create invoice with 2 line items; (c) AI Summary placeholder visible; (d) Submit invoice; (e) Login as client; (f) Invoice appears in list; (g) Approve invoice; (h) Audit trail shows 3 entries (created, submitted, approved); (i) Dashboard counts update; ✅ Phase 2 complete

---

## Phase 3: AI Agents — Claude Integration (Days 7–9)

**Goal**: All three AI agents functional with graceful fallback.
**Gate**: Every invoice interaction has AI assistance; reminders fire on manual trigger; fallback works when API key is invalid.

---

### Phase 3A: Backend — AI Agent Framework

- [ ] **T053** Create `backend/models/ai_log.py`: `AIAgentType` enum, `AIAgentLog` model from data-model.md; generate and run migration `005_create_ai_agent_logs.py`
- [ ] **T054** Create `backend/agents/base_agent.py`: `BaseAgent` class with: `anthropic_client` (initialized from config); `call(system_prompt, user_content, max_tokens=1024)` method with 10s timeout; returns `AgentResult(text, latency_ms, is_fallback)`; catches `anthropic.APIError` and all exceptions → returns fallback text + `is_fallback=True`; logs every call to `ai_agent_logs` table
- [ ] **T055 [P]** Create `backend/agents/invoice_agent.py`: extends `BaseAgent`; methods: `summarize(invoice)` → plain-language summary; `explain_to_client(invoice)` → client-facing explanation; `validate(invoice)` → returns `{is_complete, missing_fields, suggestions}`; `suggest_terms(invoice)` → payment term recommendation; each method builds structured context dict from invoice data before calling base
- [ ] **T056 [P]** Create `backend/agents/finance_agent.py`: extends `BaseAgent`; methods: `generate_receipt(transaction, invoice, freelancer, client)` → plain-language receipt text; `recommend_payment_schedule(invoice)` → schedule suggestion for large invoices
- [ ] **T057 [P]** Create `backend/agents/reminder_agent.py`: extends `BaseAgent`; methods: `generate_due_reminder(invoice, client)` → polite reminder message; `generate_overdue_followup(invoice, freelancer)` → follow-up message; `run_all(db)` → queries DB for due/overdue invoices, generates messages, creates notifications + reminder_logs

---

### Phase 3B: Backend — AI Routes

- [ ] **T058** Create `backend/schemas/ai.py` (if not exists): `AIResponseSchema { text, agent_type, is_fallback, latency_ms }`, `ValidateResponseSchema { is_complete, missing_fields, suggestions, ai_response }`
- [ ] **T059** Create `backend/api/routes/ai.py`: all AI endpoints from openapi.yaml; inject invoice_agent, finance_agent, reminder_agent; handle auth; add `POST /api/ai/reminders/run` (no auth for demo or ADMIN only); add to `main.py`

---

### Phase 3C: Frontend — AI UI Components

- [ ] **T060** Create `frontend/services/aiService.ts`: `summarizeInvoice(id)`, `explainInvoice(id)`, `validateInvoice(id)`, `suggestTerms(id)`, `generateReceipt(txId)`, `runReminders()` — all call respective AI endpoints
- [ ] **T061** Create `frontend/components/ai/AISummaryPanel.tsx`: collapsible panel below invoice form; "Generate AI Summary" button; shows loading spinner during API call; displays returned text in a styled card; shows "(AI unavailable — using fallback)" if `is_fallback=true`; TypeScript typed
- [ ] **T062** Create `frontend/components/ai/AIExplanationPanel.tsx`: similar to summary panel but for client view; "AI Explain This Invoice" button; shows explanation text
- [ ] **T063** Create `frontend/components/ai/AIReceiptPanel.tsx`: shown after payment settlement; "View AI Receipt" button; displays generated receipt; "Download" button (triggers PDF download)
- [ ] **T064** Integrate `AISummaryPanel` into `frontend/app/invoices/[id]/page.tsx` (freelancer view) and `AIExplanationPanel` (client view); add "Validate Invoice" action on DRAFT invoices showing missing fields

---

### Phase 3 Gate Verification ✅

- [ ] **T065** Phase 3 integration test: (a) Open DRAFT invoice; (b) Click "AI Summary" → summary appears within 10s; (c) Click "Validate Invoice" → shows missing/complete fields; (d) Submit invoice; (e) Login as client; (f) Open invoice; (g) Click "AI Explain" → explanation appears; (h) Set `ANTHROPIC_API_KEY=invalid`; (i) Click AI button → fallback message shown, workflow continues; ✅ Phase 3 complete

---

## Phase 4: Payment System — Circle + Arc Testnet (Days 10–11)

**Goal**: End-to-end USDC settlement on Arc Testnet with transaction record.
**Gate**: Approved invoice settled with verifiable tx hash recorded; AI receipt generated.

---

### Phase 4A: Backend — Blockchain Service

- [ ] **T066** Create `backend/models/transaction.py`: `TransactionStatus` enum, `Transaction` model from data-model.md; generate and run migration `006_create_transactions.py`
- [ ] **T067** Create `backend/services/blockchain_service.py`: `BlockchainService` class; if `CIRCLE_SIMULATE=true` → `create_wallet()` returns fake address `0xSIM-{uuid[:8]}`, `transfer_usdc(sender, receiver, amount)` returns fake `{transfer_id, tx_hash: "0xSIM-{uuid}"}`; if not simulate → call Circle API via `httpx`: `POST /v1/w3s/wallets` (create), `POST /v1/w3s/transactions/transfer` (transfer), `GET /v1/w3s/transactions/{id}` (status poll)
- [ ] **T068** Hook wallet creation to user registration in `backend/services/auth_service.py`: after user is created, call `blockchain_service.create_wallet()` → store address in `user.wallet_address`; if wallet creation fails, log warning but do not block registration

---

### Phase 4B: Backend — Payment API

- [ ] **T069** Create `backend/schemas/payment.py`: `TransactionResponse`, `PaymentInitiateResponse`
- [ ] **T070** Create `backend/repositories/transaction_repository.py`: `create`, `get_by_id`, `get_by_invoice_id`, `update_status`, `get_by_user`, `get_all`
- [ ] **T071** Create `backend/services/payment_service.py`: `initiate_payment(db, invoice_id, client_user)` → validate invoice is APPROVED, check no existing CONFIRMED transaction, call `blockchain_service.transfer_usdc`, create transaction record, trigger finance_agent receipt, update invoice to SETTLED, create notifications; `get_transaction(db, invoice_id)` → fetch transaction; `list_user_transactions(db, user_id)` → all user transactions
- [ ] **T072** Create `backend/api/routes/payments.py`: payment endpoints from openapi.yaml; add to `main.py`

---

### Phase 4C: Frontend — Payment UI

- [ ] **T073** Create `frontend/types/payment.ts`: `TransactionStatus`, `Transaction` TypeScript types
- [ ] **T074** Create `frontend/services/paymentService.ts`: `initiatePayment(invoiceId)`, `getTransaction(invoiceId)`, `listTransactions(params?)`
- [ ] **T075** Create `frontend/components/payment/PaymentButton.tsx`: "Pay Now" button visible on APPROVED invoices for CLIENT users; shows confirmation dialog with amount and recipient; loading state during payment; on success shows tx hash and "View Receipt" link
- [ ] **T076** Create `frontend/components/payment/TransactionCard.tsx`: card showing tx details: amount, sender/receiver (truncated addresses), status badge, tx hash (truncated + copy button), date; if CONFIRMED shows "Download Receipt" button
- [ ] **T077** Integrate `PaymentButton` and `AIReceiptPanel` into `frontend/app/invoices/[id]/page.tsx`
- [ ] **T078** Create `frontend/app/transactions/page.tsx`: transaction history page with `TransactionCard` list; search bar (by invoice ID or counterparty); status filter tabs (All, Pending, Confirmed, Failed); empty state

---

### Phase 4 Gate Verification ✅

- [ ] **T079** Phase 4 integration test: (a) Create invoice → submit → approve; (b) Click "Pay Now" → confirm dialog; (c) Payment initiates → tx hash displayed; (d) Invoice status → SETTLED; (e) Click "View AI Receipt" → receipt text displayed; (f) Transaction appears in history page; (g) Test with `CIRCLE_SIMULATE=true` for offline demo; ✅ Phase 4 complete

---

## Phase 5: Polish + Admin + Submission (Days 12–14)

**Goal**: Complete all 10 MVP items; demo-ready application.
**Gate**: All acceptance criteria from spec.md checklist checked off; README complete; demo video recorded.

---

### Phase 5A: Dashboard (Real Metrics)

- [x] **T080** Add backend endpoint `GET /api/dashboard/metrics` returning role-specific stats: freelancer → {total_invoices, total_earned_usdc, pending_count, overdue_count}; client → {invoices_to_approve, total_paid_usdc, recent_transactions}
- [x] **T081** Update `frontend/app/dashboard/page.tsx`: fetch real metrics; populate metric cards; add "Recent Activity" section with last 5 invoice events; add "Quick Actions" (Create Invoice for freelancer, Pending Approvals for client)

---

### Phase 5B: Admin Panel

- [x] **T082** Create `backend/api/routes/admin.py`: all admin endpoints from openapi.yaml; protected with `require_role(ADMIN)`; add to `main.py`
- [x] **T083** Create `frontend/app/admin/page.tsx`: admin dashboard with user count, transaction volume, pending invoices metrics
- [x] **T084** Create `frontend/app/admin/users/page.tsx`: user management table; activate/deactivate user toggle; role badge
- [x] **T085** Create `frontend/app/admin/transactions/page.tsx`: all-platform transaction list with filters

---

### Phase 5C: PDF Receipt Download

- [x] **T086** Add `weasyprint` or `reportlab` to `backend/requirements.txt`; create `backend/services/pdf_service.py`: `generate_receipt_pdf(receipt_text, transaction, invoice)` → returns PDF bytes; create HTML template in `backend/templates/receipt.html`
- [x] **T087** Add `GET /api/payments/{invoice_id}/receipt/pdf` endpoint: returns `application/pdf` response with filename `receipt-{invoice_id}.pdf`
- [x] **T088** Update `TransactionCard` and `AIReceiptPanel` in frontend: "Download Receipt" button calls PDF endpoint via `window.open` or `fetch` with blob download

---

### Phase 5D: UI Polish

- [x] **T089** Mobile responsiveness audit: test all pages at 375px width; fix any overflow, truncation, or touch target issues; update Sidebar to use Sheet on mobile
- [x] **T090** Loading states: add skeleton loaders (ShadCN `Skeleton`) to invoice list, dashboard metrics, and AI panels
- [x] **T091** Error handling: add global error toast (ShadCN `Toast`/`Sonner`) for API errors; ensure all 4xx/5xx responses show user-friendly messages

---

### Phase 5E: Documentation + Submission

- [x] **T092** Create `README.md` at repo root: project overview, demo screenshots, prerequisites, setup steps (backend + frontend), environment variables guide, deployment guide, architecture diagram (ASCII or image), 3-minute demo script summary
- [x] **T093** Export OpenAPI docs: ensure `backend/main.py` has correct title, description, version; verify `http://localhost:8000/docs` (Swagger) and `/redoc` work correctly
- [x] **T094** Create `docs/architecture.md` or `docs/architecture.png`: full system diagram showing frontend ↔ backend ↔ PostgreSQL ↔ Claude API ↔ Circle API ↔ Arc Testnet; AI agent flow diagram
- [x] **T095** Final acceptance criteria review: go through every item in spec.md MVP checklist; mark each ✅ or note blockers
- [ ] **T096** Record 3-minute demo video following the demo script in spec.md (hackathon submission plan section); cover all 7 steps of the core user journey
- [ ] **T097** Prepare hackathon submission: public GitHub repo, deployed URLs, video link, README reviewed for completeness

---

## Dependencies & Execution Order

### Phase Gate Dependencies

```
Phase 1 (Foundation) — no dependencies — START HERE
  └──> Phase 2 (Invoice Core) — requires Phase 1 complete
        └──> Phase 3 (AI Agents) — requires Phase 2 (needs invoices to test against)
              └──> Phase 4 (Payments) — requires Phase 3 (AI receipt triggered post-payment)
                    └──> Phase 5 (Polish) — requires Phase 4 complete
```

### Within Phase 1 — Sequential Order

```
Phase 1A (Scaffold) → Phase 1B (DB) → Phase 1C (Auth API)
                   ↘ Phase 1D (Frontend types) → Phase 1E (Auth pages) → Phase 1F (Layout/Dashboard)
                                                                               └──> T032 (Gate)
```

### Parallel Opportunities (marked [P])

- T002 + T003 (frontend + backend scaffold) — run together
- T005 + T006 (folder structures) — run together
- T033 + T034 (invoice + notification models) — run together
- T055 + T056 + T057 (three AI agents) — run together

---

## Implementation Strategy

### MVP First (Phase 1 Rule)

> **DO NOT MOVE TO PHASE 2 UNTIL T032 (Phase 1 Gate) IS VERIFIED**

1. Complete Phase 1A → 1B → 1C → 1D → 1E → 1F
2. Run T032 gate verification
3. Only then begin Phase 2

### Simulation Mode

If Circle or Claude APIs are unavailable:
- Set `CIRCLE_SIMULATE=true` — payment flows work with fake tx hashes
- Set `ANTHROPIC_API_KEY=test_invalid` — AI flows show fallback text; all other features unaffected
- Demo can be run fully offline using simulation mode

---

## Notes

- `[P]` = different files, no dependencies between them — safe to parallelize
- Each Phase gate must pass before advancing
- Commit after each completed task group (e.g., after T013, after T020, after T032)
- All backend routes should be tested in Swagger UI (`/docs`) before wiring to frontend
- No secrets in code — always read from `.env` via `config.Settings`
