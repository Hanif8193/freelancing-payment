# Quickstart: AI Freelancer Payment Agent

**Branch**: `001-ai-payment-agent` | **Date**: 2026-06-12

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.12+ | https://python.org |
| PostgreSQL | 16+ | https://postgresql.org |
| Git | any | https://git-scm.com |

---

## 1. Clone Repository

```bash
git clone <repo-url>
cd freelancer-payment
```

---

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# Create database
createdb freelancer_payment     # or use your PostgreSQL client

# Run migrations
alembic upgrade head

# Start dev server
uvicorn main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000
API docs (Swagger): http://localhost:8000/docs

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local

# Start dev server
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## 4. Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/freelancer_payment

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Circle Wallets
CIRCLE_API_KEY=your-circle-api-key
CIRCLE_ENTITY_SECRET=your-entity-secret
CIRCLE_WALLET_SET_ID=your-wallet-set-id

# Simulation mode (set to true to bypass real Circle API)
CIRCLE_SIMULATE=false

# App
ENVIRONMENT=development
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. Verify Installation

```bash
# Backend health check
curl http://localhost:8000/health

# Expected: {"status": "ok", "timestamp": "..."}

# Run backend tests
cd backend && pytest tests/ -v

# Frontend type check
cd frontend && npm run type-check
```

---

## 6. First Run: Create Test Users

```bash
# Register a freelancer
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@test.com","password":"Test1234!","full_name":"Alice Dev","role":"FREELANCER"}'

# Register a client
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"Test1234!","full_name":"Bob Corp","role":"CLIENT"}'

# Login as freelancer
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@test.com","password":"Test1234!"}'
# → returns {"access_token": "...", "token_type": "bearer"}
```

---

## 7. Demo Flow (7 Steps)

1. Login as freelancer → Create invoice → Click "AI Summary"
2. Submit invoice to client
3. Login as client → View invoice → Click "AI Explain"
4. Approve invoice
5. Click "Pay Now" → USDC settles on Arc Testnet
6. View transaction hash
7. AI Finance Agent generates receipt

---

## 8. Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend (Render)
- Create new Web Service on Render
- Connect your repository, select `backend/` as root
- Build command: `pip install -r requirements.txt && alembic upgrade head`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add all `.env` variables as Render Environment Variables
- Create a Render PostgreSQL database and update `DATABASE_URL`

---

## 9. Common Issues

| Issue | Fix |
|-------|-----|
| `asyncpg` connection error | Check `DATABASE_URL` uses `postgresql+asyncpg://` prefix |
| Alembic `target database is not up to date` | Run `alembic upgrade head` |
| CORS error in browser | Check `backend/main.py` has frontend URL in `allow_origins` |
| AI response timeout | Verify `ANTHROPIC_API_KEY` is valid; check Claude API status |
| Circle API 401 | Verify `CIRCLE_API_KEY` and `CIRCLE_ENTITY_SECRET`; or set `CIRCLE_SIMULATE=true` |
