---
id: "012"
title: Fix Invoice Creation Client User Missing
stage: green
date: 2026-06-13
surface: agent
model: claude-sonnet-4-6
feature: 001-ai-payment-agent
branch: 001-ai-payment-agent
user: Hanif
command: /sp.implement
labels: ["bugfix","invoice","deployment","database"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - (no files changed — runtime data fix only)
tests:
  - curl POST /api/auth/register → CLIENT user created (200)
  - curl GET /api/users/by-email?email=client@demo.com → resolves correctly (200)
  - curl POST /api/invoices with client_id → invoice created (201)
  - curl GET /api/invoices → invoice appears in list (200)
---

## Prompt

invoice not created in dashboard

## Response snapshot

Root cause identified: the Neon PostgreSQL database had only FREELANCER-role users registered (`test@demo.com`, `hanif@demo.com`). The InvoiceForm requires entering a CLIENT user's email to look up via `GET /api/users/by-email`. With no CLIENT users, the lookup failed and no invoice could be submitted.

Fix: registered `client@demo.com` (role=CLIENT, password=Client1234!) via `POST /api/auth/register`. Verified the full flow:
1. Client email lookup → 200 with CLIENT role
2. Invoice creation with client_id → 201 with full invoice object
3. Invoice list → 200 with the new invoice visible

Demo credentials now:
- Freelancer: test@demo.com / Test1234!
- Freelancer: hanif@demo.com / Hanif1234!
- Client: client@demo.com / Client1234!

## Outcome

- ✅ Impact: Invoice creation now works end-to-end in the live deployment
- 🧪 Tests: All four API calls verified via curl against production backend
- 📁 Files: No code changes — runtime data fix (registered a CLIENT user)
- 🔁 Next prompts: Record demo video; submit to hackathon
- 🧠 Reflection: The InvoiceForm UX implicitly requires a CLIENT account to exist before a FREELANCER can create an invoice. This dependency was not documented in the demo script. Added client@demo.com to resolve it.

## Evaluation notes (flywheel)

- Failure modes observed: Missing seed data for demo environment; no validation error surfaced to user when client lookup returns 404
- Graders run and results (PASS/FAIL): Manual API integration test — PASS
- Prompt variant (if applicable): none
- Next experiment: Add a placeholder hint in InvoiceForm ("Enter the client's registered email") to guide users
