---
id: 001
title: AI Freelancer Payment Agent Constitution
stage: constitution
date: 2026-06-12
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: hanifdostmuhammad8193@gmail.com
command: constitution submission
labels: ["constitution","project-vision","tech-stack","mvp","blockchain","ai-agents"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

# AI Freelancer Payment Agent - Project Constitution

## Project Vision

Build an AI-powered freelancer payment platform that enables freelancers and clients to create, approve, and settle invoices using USDC on Arc Testnet.

The platform must demonstrate the Agentic Economy concept by allowing AI agents to assist with invoice generation, payment recommendations, approval workflows, reminders, and transaction tracking.

The final deliverable must be suitable for submission to the Stablecoin Commerce Stack Challenge.

---

## Core Principles

### 1. AI First

Every major workflow should include meaningful AI assistance.

AI should:

* Generate invoice summaries
* Analyze payment risks
* Suggest payment schedules
* Create payment reminders
* Explain transactions in plain language

AI should not be added merely as a chatbot.

---

### 2. User Experience First

Target users are non-crypto-native freelancers and clients.

Requirements:

* Simple onboarding
* Clear payment status
* Human-readable transaction explanations
* Mobile-responsive UI
* Minimal blockchain terminology

---

### 3. Production Quality

All code must be: Modular, Type-safe, Documented, Testable, Maintainable.

---

### 4. Security First

Never expose private keys, secrets, or API credentials.
Use environment variables, secure authentication, input validation, rate limiting.

---

### 5. Blockchain Abstraction

Abstract wallet management, transaction hashes, and network details while maintaining transparency.

---

## Technical Stack

Frontend: Next.js 15, TypeScript, Tailwind CSS, ShadCN UI
Backend: FastAPI, Python 3.12+
Database: PostgreSQL
Auth: Clerk or Auth.js
AI: Claude API or OpenAI API
Blockchain: Arc Testnet, USDC, Circle Wallets

---

## MVP Requirements

1. Authentication
2. Dashboard
3. Invoice Management
4. AI Invoice Assistant
5. Approval Workflow
6. USDC Testnet Settlement
7. Transaction History
8. Architecture Diagram
9. API Documentation
10. Deployment Guide

---

## Success Criteria

* Freelancer creates invoice → Client approves → USDC settlement recorded → AI assists → 3-min demo

## Response snapshot

Constitution received and saved to `.specify/memory/constitution.md`. Project context established with all 5 core principles, full technical stack definition, agent responsibilities (Invoice Agent, Reminder Agent, Finance Agent), and 10 MVP requirements. Ready to proceed with `/sp.specify` for feature specs.

## Outcome

- ✅ Impact: Project constitution established; all principles, stack, and MVP requirements documented
- 🧪 Tests: N/A — constitution stage
- 📁 Files: .specify/memory/constitution.md, history/prompts/constitution/001-ai-freelancer-payment-agent-constitution.constitution.prompt.md
- 🔁 Next prompts: /sp.specify for first feature spec, /sp.plan for architecture planning
- 🧠 Reflection: Constitution is comprehensive — covers AI-first UX, security, blockchain abstraction, and defines three distinct AI agents (Invoice, Reminder, Finance)

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment: Begin feature specification with authentication or invoice management
