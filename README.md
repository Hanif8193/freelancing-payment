# AI Freelancer Payment Agent

> **Hackathon submission** — Stablecoin Commerce Stack Challenge · Arc Blockchain · Sponsored by Circle  
> Track: **Agentic Economy Experience**

An AI-powered payment platform where autonomous agents help freelancers and clients manage invoices, approvals, reminders, and USDC settlements on Arc Testnet.

---

## Demo

| Feature | Status |
|---------|--------|
| JWT Auth (register / login) | ✅ |
| Invoice CRUD + status machine | ✅ |
| AI Invoice Summary & Explanation | ✅ |
| AI Invoice Validation | ✅ |
| Approval workflow + audit trail | ✅ |
| USDC payment (Circle simulation) | ✅ |
| AI-generated receipt + PDF download | ✅ |
| Reminder Agent (due / overdue) | ✅ |
| Admin panel (users + transactions) | ✅ |
| Mobile-responsive UI | ✅ |

---

## Core User Journey

1. **Freelancer** creates invoice with line items
2. **AI Invoice Agent** generates a summary and validates completeness
3. Invoice submitted for client approval
4. **Client** opens invoice — AI explains it in plain language
5. Client approves invoice
6. Client clicks **Pay Now** → USDC transferred on Arc Testnet
7. **AI Finance Agent** generates a receipt; invoice marked SETTLED

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2 (async) |
| Database | PostgreSQL |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Blockchain | Arc Testnet, USDC, Circle Developer Controlled Wallets |
| Auth | JWT (python-jose + passlib/bcrypt) |

---

## Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 15+ (running locally or via Docker)
- (Optional) Anthropic API key for live AI features
- (Optional) Circle API key for live payments — defaults to simulation mode

---

## Setup

### 1 — Clone & install

```bash
git clone <repo-url>
cd "freelancing payment"
```

### 2 — Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/payagent
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

ANTHROPIC_API_KEY=sk-ant-...        # leave empty to use AI fallback mode
CIRCLE_API_KEY=                     # leave empty to use simulation mode
CIRCLE_ENTITY_SECRET=
CIRCLE_WALLET_SET_ID=
CIRCLE_SIMULATE=true                # set false for live Circle API

ENVIRONMENT=development
```

Run migrations and start:

```bash
alembic upgrade head
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3 — Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Open: http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL async connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (32+ chars) |
| `ANTHROPIC_API_KEY` | Optional | Claude API key — fallback mode if empty |
| `CIRCLE_API_KEY` | Optional | Circle API key — simulation mode if empty |
| `CIRCLE_SIMULATE` | Optional | `true` = fake wallets/tx hashes (default) |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL for frontend |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                       │
│  (auth) layout ─── register / login                         │
│  (dashboard) layout ─── invoices / transactions / admin      │
│  AI panels: Summary · Explanation · Validation · Receipt     │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (Axios + JWT)
┌────────────────────▼────────────────────────────────────────┐
│                    FastAPI Backend                            │
│  /api/auth  /api/invoices  /api/payments  /api/ai            │
│  /api/notifications  /api/dashboard  /api/admin              │
├──────────────┬──────────────────┬──────────────────────────-┤
│  PostgreSQL  │  Anthropic Claude │  Circle API / Arc Testnet │
│  (SQLAlchemy │  invoice_agent    │  blockchain_service        │
│   async)     │  finance_agent    │  USDC transfers            │
│              │  reminder_agent   │  wallet creation           │
└──────────────┴──────────────────┴───────────────────────────┘
```

### AI Agent Flow

```
Invoice created
  └─> invoice_agent.summarize()      → summary for freelancer
  └─> invoice_agent.explain()        → explanation for client
  └─> invoice_agent.validate()       → missing fields + issues
  └─> invoice_agent.suggest_terms()  → payment term advice

Payment confirmed
  └─> finance_agent.generate_receipt() → AI receipt text → PDF

Due date approaching (3 days)
  └─> reminder_agent.generate_due_reminder() → notification to client

Invoice overdue
  └─> reminder_agent.generate_overdue_followup() → notification to freelancer
```

---

## Simulation Mode

Run fully offline without any paid API keys:

```env
ANTHROPIC_API_KEY=          # empty → fallback text returned
CIRCLE_SIMULATE=true        # fake wallet addresses + tx hashes
```

All payment flows, invoice workflows, and AI panels work in simulation mode — perfect for demo environments.

---

## Project Structure

```
freelancing payment/
├── backend/
│   ├── agents/          # AI agents (invoice, finance, reminder)
│   ├── api/routes/      # FastAPI routers
│   ├── models/          # SQLAlchemy ORM models
│   ├── repositories/    # DB query layer
│   ├── services/        # Business logic
│   ├── schemas/         # Pydantic request/response models
│   ├── templates/       # HTML receipt template
│   ├── alembic/         # DB migrations
│   └── main.py
├── frontend/
│   ├── app/
│   │   ├── (auth)/      # login / register
│   │   └── (dashboard)/ # protected app pages
│   ├── components/
│   │   ├── ai/          # AI panels (summary, explanation, receipt)
│   │   ├── invoice/     # Invoice components
│   │   ├── payment/     # Payment button, transaction card
│   │   └── ui/          # ShadCN components
│   ├── services/        # API service layer
│   └── types/           # TypeScript interfaces
└── specs/               # SDD specification artifacts
```

---

## Hackathon Submission

- **Challenge**: Stablecoin Commerce Stack Challenge
- **Track**: Agentic Economy Experience
- **Sponsor**: Circle (Arc Blockchain)
- **Demo Script**: Create invoice → AI summary → submit → AI explain → approve → Pay Now (USDC) → AI receipt

---

*Built with Claude Code · Anthropic*
