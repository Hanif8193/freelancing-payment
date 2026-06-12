# Feature Specification: AI Freelancer Payment Agent

**Feature Branch**: `001-ai-payment-agent`
**Created**: 2026-06-12
**Status**: Draft
**Challenge**: Stablecoin Commerce Stack Challenge — Arc Blockchain, sponsored by Circle
**Track**: Agentic Economy Experience

---

## Product Requirements Document (PRD)

### Overview

The AI Freelancer Payment Agent is an AI-powered freelancer payment platform that enables autonomous AI agents to assist freelancers and clients in managing invoices, approvals, reminders, and USDC settlements on Arc Testnet. The platform abstracts blockchain complexity, allowing non-crypto-native users to participate in stablecoin commerce.

### Problem Statement

Freelancers and clients face friction in the payment lifecycle: manual invoice creation, delayed approvals, unclear payment status, and complex cross-border settlement. Existing tools lack AI-driven automation and do not leverage stablecoin infrastructure for instant, transparent settlement.

### Solution

A full-stack platform where three AI agents (Invoice Agent, Reminder Agent, Finance Agent) operate within a structured workflow: invoice creation → AI summary → client review → AI explanation → approval → USDC settlement → AI receipt generation.

### Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Freelancer | Independent contractor issuing invoices | Create invoices, receive USDC payment |
| Client | Business or individual paying for services | Review, approve, and settle invoices |
| Admin | Platform operator | Monitor transactions, manage users |

### Hackathon Submission Goals

- Demonstrate meaningful AI agent integration (not cosmetic chatbots)
- Show USDC settlement on Arc Testnet via Circle Wallets
- Produce a 3-minute demo video covering the full workflow
- Deliver production-quality, modular code

---

## User Scenarios & Testing

### User Story 1 — Freelancer Creates and Submits Invoice (Priority: P1)

A freelancer logs in, creates an invoice for completed work, the AI Invoice Agent generates a professional summary and detects any missing information, and the freelancer submits the invoice to the client for approval.

**Why this priority**: Core value proposition; every other workflow depends on invoice creation.

**Independent Test**: A freelancer can create, AI-review, and submit a complete invoice in a single session without touching any other feature.

**Acceptance Scenarios**:

1. **Given** a logged-in freelancer, **When** they fill in service description, amount, currency (USDC), and due date and click "Create Invoice", **Then** the invoice is saved with status `DRAFT` and assigned a unique invoice ID.
2. **Given** a saved `DRAFT` invoice, **When** the AI Invoice Agent is triggered, **Then** within 10 seconds it returns a plain-language summary, identifies any missing fields, and suggests completion.
3. **Given** a complete invoice, **When** the freelancer clicks "Submit for Approval", **Then** invoice status changes to `PENDING_APPROVAL` and the client receives a notification.
4. **Given** an invoice with missing required fields (e.g., no due date), **When** the AI Agent detects the gap, **Then** it flags the missing field with a suggested fix before submission is allowed.

---

### User Story 2 — Client Reviews and Approves Invoice (Priority: P1)

A client receives an invoice notification, the AI Invoice Agent explains the payment details in plain language, and the client approves or rejects the invoice with a reason.

**Why this priority**: Approval is the gate before payment; without it no settlement occurs.

**Independent Test**: A client can receive, AI-review, and approve or reject an invoice independently, verifiable by status change and audit trail entry.

**Acceptance Scenarios**:

1. **Given** an invoice in `PENDING_APPROVAL` status, **When** the client opens it, **Then** the AI Invoice Agent displays a plain-language explanation of what was delivered, the amount, and payment terms.
2. **Given** a client reviewing an invoice, **When** they click "Approve", **Then** invoice status changes to `APPROVED` and the freelancer is notified.
3. **Given** a client reviewing an invoice, **When** they click "Reject" and enter a reason, **Then** invoice status changes to `REJECTED`, the reason is logged in the audit trail, and the freelancer is notified.
4. **Given** an approved invoice, **When** the audit trail is viewed, **Then** it shows timestamped entries for submission, AI review, and approval with actor identity.

---

### User Story 3 — USDC Settlement on Arc Testnet (Priority: P1)

An approved invoice is settled by transferring USDC from the client's Circle Wallet to the freelancer's Circle Wallet on Arc Testnet, with the transaction recorded and explained by the AI Finance Agent.

**Why this priority**: Core blockchain demonstration required for the hackathon challenge.

**Independent Test**: Starting from an approved invoice, the full settlement flow can be demonstrated end-to-end with a verifiable transaction record.

**Acceptance Scenarios**:

1. **Given** an `APPROVED` invoice, **When** the client clicks "Pay Now", **Then** the system initiates a USDC transfer via Circle Wallet API on Arc Testnet.
2. **Given** a payment initiated, **When** the transfer completes, **Then** invoice status changes to `SETTLED`, transaction hash is recorded, and both parties are notified.
3. **Given** a completed settlement, **When** the AI Finance Agent is triggered, **Then** it generates a plain-language receipt explaining what was paid, when, and confirmation of settlement.
4. **Given** a payment attempt with insufficient USDC balance, **When** the transfer is attempted, **Then** the system surfaces a clear error message and the invoice remains `APPROVED`.

---

### User Story 4 — AI Reminder Agent Sends Due Date Notifications (Priority: P2)

The AI Reminder Agent monitors invoice due dates and sends automated reminders to clients for pending approvals and to freelancers for overdue payments.

**Why this priority**: Demonstrates autonomous agent behavior; critical for agentic economy track.

**Independent Test**: Reminders are generated and logged independently of user action; testable by setting a near-future due date and observing the reminder system.

**Acceptance Scenarios**:

1. **Given** an invoice in `PENDING_APPROVAL` with a due date 3 days away, **When** the Reminder Agent runs, **Then** the client receives a reminder notification.
2. **Given** an invoice in `APPROVED` that is past its due date, **When** the Reminder Agent runs, **Then** the freelancer receives a follow-up message and the invoice is flagged as `OVERDUE`.
3. **Given** a reminder is sent, **When** the notification log is checked, **Then** each reminder shows timestamp, recipient, invoice ID, and message content.

---

### User Story 5 — Freelancer Manages Invoice Lifecycle (Priority: P2)

A freelancer can view all their invoices in a list, edit draft invoices, delete drafts, and track status changes in real time through the dashboard.

**Why this priority**: Essential for day-to-day usability; freelancers need full CRUD control over their work.

**Independent Test**: All CRUD operations on invoices can be tested without triggering approval or payment flows.

**Acceptance Scenarios**:

1. **Given** a logged-in freelancer, **When** they visit the Invoice Management page, **Then** they see all their invoices with status badges, amounts, and due dates.
2. **Given** a `DRAFT` invoice, **When** the freelancer edits and saves it, **Then** the updated details are persisted and AI summary is refreshed.
3. **Given** a `DRAFT` invoice, **When** the freelancer deletes it, **Then** it is removed and a confirmation is shown.
4. **Given** an invoice in `PENDING_APPROVAL` or later status, **When** the freelancer attempts to edit it, **Then** the system prevents editing and explains why.

---

### User Story 6 — Dashboard Overview (Priority: P2)

Both freelancers and clients land on a role-specific dashboard showing key metrics: total invoices, pending approvals, completed settlements, and outstanding balance.

**Why this priority**: Entry point to the app; drives orientation and task initiation.

**Independent Test**: Dashboard renders meaningful data from existing invoices without requiring any new action.

**Acceptance Scenarios**:

1. **Given** a logged-in freelancer, **When** they visit the Dashboard, **Then** they see: total invoices created, total USDC earned, pending invoice count, and overdue invoice count.
2. **Given** a logged-in client, **When** they visit the Dashboard, **Then** they see: invoices awaiting approval, total USDC paid, and recent transaction history.
3. **Given** no invoices exist, **When** a new user visits the Dashboard, **Then** they see an empty state with a clear call-to-action to create their first invoice.

---

### User Story 7 — Transaction History with Search (Priority: P3)

Users can view a searchable, filterable history of all transactions, filter by status or date range, and download receipts.

**Why this priority**: Operational transparency; needed for demo completeness and hackathon submission criteria.

**Independent Test**: Transaction history can be browsed and searched without triggering new workflows.

**Acceptance Scenarios**:

1. **Given** a user with completed transactions, **When** they visit Transaction History, **Then** they see a list with invoice ID, counterparty, amount, date, and status.
2. **Given** the transaction list, **When** the user searches by invoice ID or counterparty name, **Then** results are filtered in real time.
3. **Given** a settled transaction, **When** the user clicks "Download Receipt", **Then** a receipt file is generated and downloaded.

---

### User Story 8 — Admin Monitors Platform Activity (Priority: P3)

An admin user can view all users, monitor all transactions across the platform, view activity logs, and manage user accounts.

**Why this priority**: Operational oversight; needed for platform management and demo credibility.

**Independent Test**: Admin panel displays aggregate data independently of the freelancer/client flow.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they log in, **Then** they are routed to the Admin Dashboard showing total users, total transactions, and total USDC volume.
2. **Given** the admin panel, **When** the admin views the user list, **Then** they can see all users with roles, registration dates, and account status.
3. **Given** the admin panel, **When** the admin views the activity log, **Then** they see timestamped entries for all invoice, approval, and payment events.

---

### Edge Cases

- What happens when a Circle Wallet API call times out during settlement?
- How does the system handle duplicate invoice submissions?
- What if the AI agent API is unavailable — does the workflow continue without AI or block?
- What if a client tries to pay an already-settled invoice?
- What happens when a user registers with an email already in use?
- What if an invoice amount is set to zero or a negative number?
- What if the Arc Testnet is unreachable at time of settlement?
- How are concurrent approval requests for the same invoice handled?

---

## Requirements

### Functional Requirements

#### Authentication (FR-AUTH)

- **FR-AUTH-001**: System MUST allow users to register with email and password.
- **FR-AUTH-002**: System MUST allow users to log in and receive a session token.
- **FR-AUTH-003**: System MUST support user roles: `FREELANCER`, `CLIENT`, `ADMIN`.
- **FR-AUTH-004**: System MUST protect all non-public routes with authentication.
- **FR-AUTH-005**: System MUST allow users to view and update their profile (name, email, bio).
- **FR-AUTH-006**: System MUST enforce password strength requirements.
- **FR-AUTH-007**: System MUST log out users and invalidate sessions on request.

#### Invoice Management (FR-INV)

- **FR-INV-001**: Freelancers MUST be able to create invoices with: title, line items (description, quantity, unit price), total amount, currency (USDC), due date, client selection, and payment terms.
- **FR-INV-002**: System MUST assign a unique invoice ID and creation timestamp to each invoice.
- **FR-INV-003**: Freelancers MUST be able to edit invoices in `DRAFT` status only.
- **FR-INV-004**: Freelancers MUST be able to delete invoices in `DRAFT` status only.
- **FR-INV-005**: All parties MUST be able to view invoice details including status history.
- **FR-INV-006**: System MUST enforce invoice status transitions: `DRAFT` → `PENDING_APPROVAL` → `APPROVED` | `REJECTED` → `SETTLED` | `OVERDUE`.
- **FR-INV-007**: System MUST prevent invalid status transitions.

#### AI Invoice Agent (FR-AI-INV)

- **FR-AI-INV-001**: System MUST generate a plain-language summary of any invoice on demand.
- **FR-AI-INV-002**: System MUST detect missing or incomplete invoice fields and surface specific suggestions.
- **FR-AI-INV-003**: System MUST explain invoice payment details to the client in non-technical language.
- **FR-AI-INV-004**: System MUST suggest standard payment terms if none are provided.
- **FR-AI-INV-005**: AI summaries and suggestions MUST be returned within 10 seconds.
- **FR-AI-INV-006**: System MUST handle AI service unavailability gracefully — workflow continues with a fallback message.

#### Approval Workflow (FR-APPR)

- **FR-APPR-001**: Freelancers MUST be able to submit `DRAFT` invoices for client approval.
- **FR-APPR-002**: Clients MUST be able to approve invoices with a single action.
- **FR-APPR-003**: Clients MUST be able to reject invoices with a mandatory rejection reason.
- **FR-APPR-004**: System MUST record every status change in an audit trail with: actor, timestamp, action, and optional note.
- **FR-APPR-005**: System MUST notify the counterparty (freelancer/client) on every status change.
- **FR-APPR-006**: System MUST prevent anyone other than the assigned client from approving/rejecting an invoice.

#### Payment System (FR-PAY)

- **FR-PAY-001**: System MUST integrate with Circle Wallet API to create and manage wallets per user.
- **FR-PAY-002**: System MUST initiate USDC transfers on Arc Testnet for approved invoices.
- **FR-PAY-003**: System MUST record transaction hash, timestamp, sender wallet, receiver wallet, and amount for every settlement.
- **FR-PAY-004**: System MUST update invoice status to `SETTLED` upon confirmed transaction.
- **FR-PAY-005**: System MUST surface clear error messages when payment fails.
- **FR-PAY-006**: System MUST prevent double-payment of already-settled invoices.

#### AI Finance Agent (FR-AI-FIN)

- **FR-AI-FIN-001**: System MUST generate a plain-language receipt after every successful settlement.
- **FR-AI-FIN-002**: System MUST provide payment schedule recommendations for large invoices on request.
- **FR-AI-FIN-003**: System MUST flag unusual payment patterns for review.

#### AI Reminder Agent (FR-AI-REM)

- **FR-AI-REM-001**: System MUST send reminders to clients for invoices in `PENDING_APPROVAL` approaching their due date (3-day warning).
- **FR-AI-REM-002**: System MUST send payment follow-ups to clients for `APPROVED` invoices past their due date.
- **FR-AI-REM-003**: System MUST mark invoices as `OVERDUE` when due date passes without settlement.
- **FR-AI-REM-004**: System MUST log all reminders with timestamp, recipient, and content.
- **FR-AI-REM-005**: Users MUST be able to configure reminder preferences (on/off).

#### Transaction History (FR-TXN)

- **FR-TXN-001**: System MUST display a paginated list of all transactions for the authenticated user.
- **FR-TXN-002**: System MUST allow filtering transactions by: status, date range, counterparty.
- **FR-TXN-003**: System MUST allow searching transactions by invoice ID or counterparty name.
- **FR-TXN-004**: System MUST allow users to download a receipt for any settled transaction.

#### Admin Features (FR-ADMIN)

- **FR-ADMIN-001**: Admin MUST have access to a dedicated admin dashboard with aggregate metrics.
- **FR-ADMIN-002**: Admin MUST be able to view all users, their roles, and account status.
- **FR-ADMIN-003**: Admin MUST be able to deactivate or reactivate user accounts.
- **FR-ADMIN-004**: Admin MUST be able to view all transactions across all users.
- **FR-ADMIN-005**: Admin MUST have access to a system-wide activity log.

---

### Non-Functional Requirements

#### Performance (NFR-PERF)

- **NFR-PERF-001**: All page navigations MUST load within 3 seconds on a standard broadband connection.
- **NFR-PERF-002**: AI agent responses MUST complete within 10 seconds.
- **NFR-PERF-003**: The UI MUST be fully responsive on screen widths from 375px (mobile) to 1920px (desktop).
- **NFR-PERF-004**: Dashboard metrics MUST refresh without full page reload.

#### Security (NFR-SEC)

- **NFR-SEC-001**: All API credentials, private keys, and secrets MUST be stored in environment variables; never in source code.
- **NFR-SEC-002**: All API endpoints MUST require authentication except registration and login.
- **NFR-SEC-003**: All user inputs MUST be validated and sanitized before processing.
- **NFR-SEC-004**: Payment endpoints MUST require additional authorization confirmation.
- **NFR-SEC-005**: The system MUST use HTTPS in production.
- **NFR-SEC-006**: Session tokens MUST expire after a configurable period of inactivity.

#### Scalability (NFR-SCALE)

- **NFR-SCALE-001**: The system MUST use a modular architecture with clear separation between frontend, backend, and AI services.
- **NFR-SCALE-002**: AI agent logic MUST be isolated in dedicated service modules, independently testable.
- **NFR-SCALE-003**: Database schema MUST support multi-user isolation (each user sees only their data).
- **NFR-SCALE-004**: The codebase MUST follow SOLID principles to support extension without modification.

#### Reliability (NFR-REL)

- **NFR-REL-001**: System MUST handle AI service outages gracefully — all non-AI workflows MUST remain functional.
- **NFR-REL-002**: System MUST handle Arc Testnet connectivity issues without data loss.
- **NFR-REL-003**: All database writes MUST be atomic; partial invoice or payment records MUST NOT be persisted.

---

### Key Entities

- **User**: A platform participant with role (FREELANCER, CLIENT, ADMIN), profile details, and an associated Circle Wallet address. The identity anchor for all transactions and permissions.
- **Invoice**: A payment request from a freelancer to a client, containing line items, total USDC amount, due date, payment terms, and a status that transitions through a defined lifecycle.
- **InvoiceAuditEntry**: An immutable record of each invoice status change, capturing actor, timestamp, previous/new status, and optional reason. Provides the complete audit trail.
- **Transaction**: A confirmed or attempted USDC transfer on Arc Testnet, linked to an invoice. Stores wallet addresses, amount, transaction hash, and confirmation status.
- **AIAgentLog**: A record of every AI agent invocation — agent type, input context, output text, model used, and latency. Enables transparency and debugging of AI behavior.
- **Notification**: An in-app message sent to a user when an invoice status changes, a payment is made, or a reminder fires.
- **ReminderLog**: A record of every reminder sent by the AI Reminder Agent, enabling audit of autonomous agent behavior.

---

## Database Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| role | ENUM | FREELANCER / CLIENT / ADMIN |
| bio | TEXT | nullable |
| wallet_address | VARCHAR(255) | nullable |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### `invoices`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| title | VARCHAR(500) | NOT NULL |
| line_items | JSONB | NOT NULL |
| total_amount | DECIMAL(18,6) | NOT NULL |
| currency | VARCHAR(10) | DEFAULT 'USDC' |
| due_date | DATE | NOT NULL |
| payment_terms | TEXT | nullable |
| status | ENUM | DRAFT / PENDING_APPROVAL / APPROVED / REJECTED / SETTLED / OVERDUE |
| freelancer_id | UUID | FK → users.id |
| client_id | UUID | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### `invoice_audit_entries`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| invoice_id | UUID | FK → invoices.id |
| actor_id | UUID | FK → users.id |
| prev_status | VARCHAR(50) | nullable |
| new_status | VARCHAR(50) | NOT NULL |
| note | TEXT | nullable |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `transactions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| invoice_id | UUID | FK → invoices.id, UNIQUE |
| sender_wallet | VARCHAR(255) | NOT NULL |
| receiver_wallet | VARCHAR(255) | NOT NULL |
| amount | DECIMAL(18,6) | NOT NULL |
| currency | VARCHAR(10) | DEFAULT 'USDC' |
| tx_hash | VARCHAR(255) | nullable |
| status | ENUM | PENDING / CONFIRMED / FAILED |
| initiated_at | TIMESTAMP | DEFAULT NOW() |
| settled_at | TIMESTAMP | nullable |

### `ai_agent_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| agent_type | ENUM | INVOICE / REMINDER / FINANCE |
| invoice_id | UUID | FK → invoices.id |
| input_summary | TEXT | nullable |
| output_text | TEXT | NOT NULL |
| model_used | VARCHAR(100) | nullable |
| latency_ms | INTEGER | nullable |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| recipient_id | UUID | FK → users.id |
| type | ENUM | REMINDER / APPROVAL_REQUEST / STATUS_CHANGE / SETTLEMENT |
| message | TEXT | NOT NULL |
| is_read | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `reminder_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| invoice_id | UUID | FK → invoices.id |
| recipient_id | UUID | FK → users.id |
| reminder_type | VARCHAR(100) | NOT NULL |
| message | TEXT | NOT NULL |
| sent_at | TIMESTAMP | DEFAULT NOW() |

---

## API Specification

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and receive token | No |
| POST | `/api/auth/logout` | Invalidate session | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PATCH | `/api/auth/me` | Update current user profile | Yes |

### Invoices

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/invoices` | List invoices for current user | Yes |
| POST | `/api/invoices` | Create new invoice | Yes (FREELANCER) |
| GET | `/api/invoices/{id}` | Get invoice details | Yes |
| PATCH | `/api/invoices/{id}` | Update DRAFT invoice | Yes (owner) |
| DELETE | `/api/invoices/{id}` | Delete DRAFT invoice | Yes (owner) |
| POST | `/api/invoices/{id}/submit` | Submit for approval | Yes (FREELANCER) |
| POST | `/api/invoices/{id}/approve` | Approve invoice | Yes (CLIENT, assigned) |
| POST | `/api/invoices/{id}/reject` | Reject with reason | Yes (CLIENT, assigned) |
| GET | `/api/invoices/{id}/audit` | Get audit trail | Yes |

### Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/{invoice_id}/pay` | Initiate USDC settlement | Yes (CLIENT) |
| GET | `/api/payments/{invoice_id}` | Get transaction details | Yes |
| GET | `/api/payments` | List all transactions for user | Yes |

### AI Agents

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/invoice/{id}/summarize` | Generate invoice summary | Yes |
| POST | `/api/ai/invoice/{id}/explain` | Explain invoice to client | Yes |
| POST | `/api/ai/invoice/{id}/validate` | Detect missing fields | Yes |
| POST | `/api/ai/invoice/{id}/suggest-terms` | Suggest payment terms | Yes |
| POST | `/api/ai/payment/{tx_id}/receipt` | Generate payment receipt | Yes |
| GET | `/api/ai/logs` | Get AI agent logs for user | Yes |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications for user | Yes |
| PATCH | `/api/notifications/{id}/read` | Mark as read | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Yes (ADMIN) |
| PATCH | `/api/admin/users/{id}` | Update user status | Yes (ADMIN) |
| GET | `/api/admin/transactions` | List all transactions | Yes (ADMIN) |
| GET | `/api/admin/logs` | View activity logs | Yes (ADMIN) |
| GET | `/api/admin/metrics` | Aggregate platform metrics | Yes (ADMIN) |

---

## System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 15)                   │
│  app/ │ components/ │ features/ │ services/ │ types/     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS REST
┌───────────────────────▼─────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  api/routes/ → services/ → repositories/ → models/      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AI Agents Layer                     │   │
│  │  invoice_agent │ reminder_agent │ finance_agent  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────┐  ┌──────────────────────────────┐   │
│  │  PostgreSQL    │  │  Circle Wallet / Arc Testnet  │   │
│  └────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Layer | Responsibility |
|-------|---------------|
| Frontend `app/` | Page routing, server components, layout |
| Frontend `features/` | Feature-specific UI logic |
| Frontend `services/` | API client — all backend calls go here |
| Backend `api/` | HTTP routing, request validation, serialization |
| Backend `services/` | Business logic, orchestration |
| Backend `repositories/` | Database queries, data access objects |
| Backend `agents/` | AI prompting, response parsing, fallback logic |
| Backend `models/` | ORM models |
| Backend `schemas/` | Request/response validation schemas |

### AI Agent Pattern

Each agent follows a consistent 5-step pattern:

1. **Input Builder** — assembles structured context from database entities
2. **Prompt Renderer** — formats context into a prompt using a template
3. **Model Caller** — sends prompt to Claude API with system instructions
4. **Response Parser** — extracts structured output from model response
5. **Logger** — persists input, output, and latency to `ai_agent_logs`
6. **Fallback Handler** — returns graceful fallback if model call fails

---

## Folder Structure

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── dashboard/page.tsx
│   ├── invoices/page.tsx
│   ├── invoices/new/page.tsx
│   ├── invoices/[id]/page.tsx
│   ├── payments/page.tsx
│   ├── transactions/page.tsx
│   ├── admin/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/              (ShadCN)
│   ├── layout/Sidebar.tsx
│   ├── layout/Header.tsx
│   ├── invoice/InvoiceCard.tsx
│   ├── invoice/InvoiceForm.tsx
│   ├── invoice/AuditTrail.tsx
│   ├── ai/AISummaryPanel.tsx
│   ├── ai/AIExplanationPanel.tsx
│   └── payment/PaymentButton.tsx
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
└── types/
    ├── invoice.ts
    ├── user.ts
    └── payment.ts
```

### Backend (`/backend`)

```
backend/
├── api/routes/
│   ├── auth.py
│   ├── invoices.py
│   ├── payments.py
│   ├── ai.py
│   ├── notifications.py
│   └── admin.py
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
│   └── transaction.py
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
├── main.py
├── config.py
└── database.py
```

---

## Development Phases

### Phase 1 — Foundation (Days 1–3)

**Goal**: Working authentication and database layer.

- Project scaffolding (frontend + backend)
- PostgreSQL database with all tables + Alembic migrations
- User registration, login, and session management
- Role-based route protection
- Basic UI shell: navigation, layout, auth pages

**Done when**: Users can register, log in, and see a protected dashboard.

---

### Phase 2 — Invoice Core (Days 4–6)

**Goal**: Full CRUD invoice management with status machine.

- Invoice creation form with line items
- Invoice list, detail view, edit, delete
- Status machine enforcement
- Invoice submission to client
- Audit trail recording
- Approval / rejection by client
- In-app notifications for status changes

**Done when**: Freelancer creates and submits an invoice; client approves or rejects with audit trail.

---

### Phase 3 — AI Agents (Days 7–9)

**Goal**: All three AI agents integrated and functional.

- Invoice Agent: summary, missing field detection, payment term suggestions
- Finance Agent: receipt generation, payment recommendations
- Reminder Agent: due date monitoring, overdue flagging, notifications
- AI agent logs persisted
- Graceful fallback when Claude API is unavailable
- AI summary panel in invoice detail UI

**Done when**: Every invoice interaction has AI assistance; reminders fire autonomously.

---

### Phase 4 — Blockchain Settlement (Days 10–11)

**Goal**: USDC settlement on Arc Testnet via Circle Wallets.

- Circle Wallet creation per user on registration
- USDC transfer initiation for approved invoices
- Transaction record creation and hash storage
- Invoice status update to `SETTLED` on confirmation
- Error handling for failed transactions
- AI Finance Agent receipt generation post-settlement

**Done when**: Full end-to-end payment flow demonstrated on Arc Testnet.

---

### Phase 5 — Polish and Submission (Days 12–14)

**Goal**: Production-quality finish and hackathon deliverables.

- Transaction History: search, filter, download receipt
- Admin panel: user management, metrics, logs
- Dashboard with real metrics
- Mobile-responsive UI polish
- Architecture diagram
- API documentation
- Deployment guide (README)
- 3-minute demo video recording

**Done when**: All 10 MVP items complete; demo video recorded; submission ready.

---

## Acceptance Criteria

### MVP Acceptance Checklist

- [ ] A freelancer can register, log in, and create an invoice with line items
- [ ] The AI Invoice Agent generates a summary and detects missing fields
- [ ] The freelancer can submit the invoice to a client
- [ ] The client receives a notification and can view the invoice with AI explanation
- [ ] The client can approve or reject the invoice; the audit trail records the action
- [ ] The AI Reminder Agent sends notifications for due-date approaching and overdue invoices
- [ ] An approved invoice can be settled with USDC on Arc Testnet
- [ ] The transaction is recorded with a transaction hash
- [ ] The AI Finance Agent generates a plain-language receipt after settlement
- [ ] The transaction history is browsable, searchable, and downloadable
- [ ] The admin can view all users and transactions
- [ ] All AI workflows degrade gracefully when the AI service is unavailable
- [ ] The UI is responsive on mobile (375px) and desktop (1440px)
- [ ] No secrets or API keys are present in source code
- [ ] Architecture diagram is included in the repository

---

## Risk Analysis

### Risk 1 — Circle Wallet API / Arc Testnet Availability

**Probability**: Medium | **Impact**: High

The hackathon depends on Arc Testnet and Circle Wallet APIs. If unavailable during demo, the core blockchain feature cannot be demonstrated.

**Mitigation**:
- Build a simulation mode that mocks USDC transfers and returns fake transaction hashes
- Mark simulation vs. real transactions clearly in the UI
- Test the real API integration early (Phase 4) to identify issues before demo day

---

### Risk 2 — Claude API Latency / Availability

**Probability**: Low | **Impact**: Medium

If the Claude API is slow or unavailable, AI-dependent UX will degrade.

**Mitigation**:
- Implement a fallback response for each AI endpoint
- Add a 10-second timeout with user-facing progress indicator
- Cache AI outputs per invoice to reduce repeat API calls

---

### Risk 3 — Scope Overrun in 2-Week Timeline

**Probability**: High | **Impact**: Medium

The feature set is comprehensive; building all 10 MVP items at production quality in 14 days is ambitious.

**Mitigation**:
- Phase 1–3 are hard-deadline gates; only proceed to Phase 4 after core flows work
- Admin features are the first cut candidate if timeline is tight
- Focus demo video on the core 7-step user journey
- Use ShadCN UI components to reduce UI build time

---

### Risk 4 — Database Migration Complexity

**Probability**: Low | **Impact**: Low

Schema changes mid-development can break existing data.

**Mitigation**: Use Alembic for all schema migrations from Day 1; no manual schema modifications.

---

## Hackathon Submission Plan

### Submission Deliverables

| Deliverable | Phase | Notes |
|-------------|-------|-------|
| Working application (deployed or runnable locally) | Phase 5 | Include `.env.example` |
| 3-minute demo video | Phase 5 | Cover full 7-step user journey |
| GitHub repository (public) | Ongoing | Clean commit history |
| README with setup instructions | Phase 5 | Prerequisites, install, run |
| Architecture diagram | Phase 5 | System + AI agent flow |
| API documentation | Auto-generated | FastAPI `/docs` endpoint |

### Demo Video Script (3 minutes)

**[0:00–0:20] Introduction**
Introduce the platform: AI Freelancer Payment Agent for the Stablecoin Commerce Stack Challenge. Agentic Economy track.

**[0:20–0:50] Freelancer Flow**
1. Log in as freelancer → create invoice → AI generates summary and detects missing fields → submit to client

**[0:50–1:30] Client Flow**
1. Log in as client → see notification → open invoice → AI explains payment details → approve → Pay Now → USDC transfers on Arc Testnet → transaction hash confirmed

**[1:30–1:50] AI Receipt**
AI Finance Agent generates plain-language receipt. Download receipt.

**[1:50–2:20] Autonomous Agents**
Show AI Reminder Agent log firing due-date reminder. Show overdue invoice detection.

**[2:20–2:45] History and Admin**
Browse and search transaction history. Admin dashboard with aggregate metrics.

**[2:45–3:00] Close**
"Three AI agents, one stablecoin workflow — the Agentic Economy in action."

### Scoring Alignment

| Judging Criterion | How We Address It |
|-------------------|--------------------|
| AI / Agentic Experience | Three distinct AI agents with autonomous behavior (Invoice, Reminder, Finance) |
| Blockchain Integration | USDC settlement on Arc Testnet; transaction hashes recorded and displayed |
| UX / Non-crypto-native | Plain-language AI explanations; no blockchain terminology exposed to users |
| Code Quality | Modular, typed, tested, documented; SOLID principles throughout |
| Innovation | AI-powered audit trails, AI receipt generation, autonomous reminder scheduling |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new user can complete registration and reach the dashboard in under 2 minutes.
- **SC-002**: A freelancer can create and submit a complete invoice in under 3 minutes.
- **SC-003**: The AI Invoice Agent returns a summary within 10 seconds of request.
- **SC-004**: An approved invoice can be settled end-to-end in under 30 seconds on Arc Testnet.
- **SC-005**: 100% of settled invoices have a corresponding transaction hash recorded.
- **SC-006**: The full core user journey can be demonstrated in a single 3-minute video.
- **SC-007**: All AI-dependent features degrade gracefully — 100% of non-AI workflows remain functional when AI service is unavailable.
- **SC-008**: The application renders correctly on both 375px mobile and 1440px desktop without horizontal scroll.
- **SC-009**: Zero secrets or credentials are present in the source code repository.
- **SC-010**: All 10 MVP items are demonstrably functional at time of submission.

---

## Assumptions

1. Arc Testnet USDC is freely available for testing (no real money involved).
2. Circle Wallet API supports wallet creation and USDC transfers on Arc Testnet programmatically.
3. The Claude API is accessible during development and demo with sufficient rate limits.
4. A single developer or small team is building this in 14 days; admin features may be descoped if timeline is tight.
5. Email notifications are out of scope for MVP; in-app notifications are sufficient.
6. The application will be demonstrated in a testnet environment; mainnet deployment is not required.
7. PDF receipt generation can use a simple HTML-to-PDF renderer rather than a dedicated service.
