# 3-Minute Demo Script — AI Freelancer Payment Agent

**Hackathon**: Stablecoin Commerce Stack Challenge · Arc Blockchain · Circle  
**Track**: Agentic Economy Experience  
**Total Time**: ~3 minutes

---

## Pre-Demo Setup

Before starting the demo, ensure the following are running:

```bash
# Terminal 1 — Backend
cd backend
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
alembic upgrade head
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000 in a browser.

**Required `.env` for demo:**
```env
CIRCLE_SIMULATE=true          # offline payments with fake tx hashes
ANTHROPIC_API_KEY=sk-ant-...  # or leave empty for fallback mode
```

---

## Demo Flow

### Step 1 — Login as Freelancer (0:00–0:20)

1. Open http://localhost:3000 → auto-redirects to `/login`
2. Enter freelancer credentials (email + password)
3. Click **Sign In**
4. **Point out**: Dashboard loads with real-time metrics — Total Invoices, Pending Approvals, USDC Earned, Overdue count
5. **Talking point**: "The dashboard shows live data pulled from PostgreSQL via a role-specific metrics endpoint."

---

### Step 2 — Create Invoice (0:20–0:50)

1. Click **New Invoice** button (top-right or sidebar)
2. Fill in:
   - **Title**: "Website Redesign — June 2026"
   - **Client**: select the client user by email
   - **Line items**:
     - "UI Design" — 20 hrs × $50 = $1,000
     - "Frontend Development" — 15 hrs × $80 = $1,200
   - **Due date**: 30 days from today
   - **Payment terms**: Net 30 — payment due within 30 days of invoice date
3. Click **Create Invoice**
4. **Point out**: Invoice saved as `DRAFT` with a unique ID

---

### Step 3 — AI Summarize Invoice (0:50–1:10)

1. On the invoice detail page, click **Generate AI Summary**
2. Loading spinner appears (AI agent is calling Claude)
3. Summary appears: plain-language breakdown of work done, total, due date
4. **Optional**: Click **Validate Invoice** to see field completeness check
5. **Talking point**: "The Invoice Agent uses Claude to write this summary — it reads every line item, calculates the total, and produces a client-ready explanation. If the API is unavailable, a fallback message is shown and the workflow continues unblocked."

---

### Step 4 — Submit Invoice (1:10–1:20)

1. Click **Submit for Approval** button
2. Invoice status changes to `PENDING_APPROVAL` (yellow badge)
3. **Point out**: Audit trail at the bottom now shows "Submitted by [freelancer name]" with timestamp
4. **Talking point**: "Every status change is recorded in an append-only audit trail."

---

### Step 5 — Approve Invoice as Client (1:20–1:45)

1. Log out (top-right dropdown → Logout)
2. Log in as the **Client** user
3. Navigate to **Invoices** — the pending invoice appears at the top
4. Open the invoice → click **AI Explain This Invoice**
5. The Finance AI explains the invoice in plain language for the client
6. Click **Approve**
7. Invoice status → `APPROVED` (blue badge)
8. **Point out**: Audit trail now shows three entries: Created, Submitted, Approved

---

### Step 6 — Execute USDC Payment (1:45–2:10)

1. Click **Pay Now** (visible to client on APPROVED invoices)
2. Confirmation dialog appears: "Transfer $2,200 USDC to [Freelancer Name]?"
3. Click **Confirm Payment**
4. Loading state — payment is being processed
5. Success: tx hash displayed (e.g. `0xSIM-a1b2c3d4`)
6. Invoice status → `SETTLED` (green badge)
7. **Talking point**: "In simulation mode this uses a fake tx hash. With a real Circle API key and Arc Testnet wallet, this is an actual USDC transfer on-chain."

---

### Step 7 — Show AI Receipt (2:10–2:30)

1. Click **View AI Receipt** button (appears after settlement)
2. AI-generated receipt text displayed: professional payment confirmation with payer/payee details, amount, tx hash
3. Click **Download Receipt** → PDF (or HTML fallback) downloads
4. **Talking point**: "The Finance Agent generates this receipt text using Claude. It's then rendered as a PDF using a simple HTML template."

---

### Step 8 — Show Transaction History (2:30–2:45)

1. Navigate to **Transactions** in the sidebar
2. Transaction card shows: amount, sender/receiver addresses, status badge, tx hash, date
3. **Talking point**: "All USDC transactions are stored in PostgreSQL and visible here. The same view exists for both freelancer and client."

---

### Step 9 — Show Admin Logs (2:45–2:55)

1. Log out, log in as **Admin** user
2. Navigate to **Admin → User Management**
3. Show user table: all registered users, roles, wallet addresses, active status, activate/deactivate toggle
4. Navigate to **Admin → Transactions** — platform-wide view of all transactions
5. **Talking point**: "Admins can monitor the entire platform. The AI Logs endpoint (`/api/ai/logs`) also records every Claude call with latency and fallback status."

---

### Step 10 — Notifications & Reminder Agent (2:55–3:00)

1. Show notification bell badge on dashboard (unread count)
2. **Bonus**: call `POST /api/ai/reminders/run` from Swagger at http://localhost:8000/docs
3. Show that due/overdue invoices generate notification records
4. **Closing point**: "Three autonomous AI agents — Invoice, Finance, and Reminder — assist at every stage. No blockchain knowledge required from the user. All USDC settlement is abstracted behind a simple Pay Now button."

---

## Talking Points Summary

| Feature | What to Highlight |
|---------|-------------------|
| AI Invoice Summary | Claude reads line items, writes plain-language summary |
| AI Validation | Detects missing fields before submission |
| AI Client Explanation | Translates invoice into non-technical language |
| AI Receipt | Auto-generated after USDC payment settles |
| Reminder Agent | Scans for due/overdue invoices, sends notifications |
| USDC Payment | Circle simulation; real Arc Testnet with live keys |
| Audit Trail | Immutable history of every status change |
| Fallback Mode | All features work without API keys |

---

## Backup Plan (if API is slow)

- **AI unavailable**: Show the `(AI unavailable — fallback mode)` banner — emphasise this is intentional graceful degradation
- **DB not running**: Use pre-recorded screenshots from `docs/screenshots/` if available
- **Payment fails**: Verify `CIRCLE_SIMULATE=true` is set in `backend/.env`

---

*Demo script for Stablecoin Commerce Stack Challenge submission.*
