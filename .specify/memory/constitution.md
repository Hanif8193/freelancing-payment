# AI Freelancer Payment Agent Constitution

## Project Vision

Build an AI-powered freelancer payment platform that enables freelancers and clients to create, approve, and settle invoices using USDC on Arc Testnet.

The platform must demonstrate the Agentic Economy concept by allowing AI agents to assist with invoice generation, payment recommendations, approval workflows, reminders, and transaction tracking.

The final deliverable must be suitable for submission to the Stablecoin Commerce Stack Challenge.

---

## Core Principles

### I. AI First

Every major workflow should include meaningful AI assistance.

AI should:
* Generate invoice summaries
* Analyze payment risks
* Suggest payment schedules
* Create payment reminders
* Explain transactions in plain language

AI should not be added merely as a chatbot.

### II. User Experience First

Target users are non-crypto-native freelancers and clients.

Requirements:
* Simple onboarding
* Clear payment status
* Human-readable transaction explanations
* Mobile-responsive UI
* Minimal blockchain terminology

### III. Production Quality

All code must be:
* Modular
* Type-safe
* Documented
* Testable
* Maintainable

Avoid quick hacks and temporary solutions.

### IV. Security First

Never expose:
* Private keys
* Secrets
* API credentials

Use:
* Environment variables
* Secure authentication
* Input validation
* Rate limiting where applicable

### V. Blockchain Abstraction

Users should not need blockchain knowledge.

The application should abstract:
* Wallet management
* Transaction hashes
* Network details

while maintaining transparency.

---

## Technical Stack

### Frontend
* Next.js 15
* TypeScript
* Tailwind CSS
* ShadCN UI

### Backend
* FastAPI
* Python 3.12+

### Database
* PostgreSQL

### Authentication
* Clerk or Auth.js

### AI Layer
* Claude API or OpenAI API

### Blockchain
* Arc Testnet
* USDC
* Circle Wallets

---

## Architecture Rules

- Frontend must never directly access sensitive credentials.
- All payment actions must go through backend APIs.
- AI services must be isolated in dedicated service modules.
- Business logic must not be placed inside UI components.

---

## Folder Structure Standards

### Frontend
* app/
* components/
* features/
* services/
* lib/
* types/

### Backend
* api/
* services/
* models/
* repositories/
* schemas/
* agents/
* tests/

---

## Agent Responsibilities

### Invoice Agent
* Invoice drafting
* Invoice summaries
* Payment explanation

### Reminder Agent
* Due-date reminders
* Follow-up messages

### Finance Agent
* Payment recommendations
* Budget analysis
* Settlement suggestions

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

* A freelancer can create an invoice
* A client can approve it
* The system records a USDC settlement
* AI provides meaningful assistance
* The workflow can be demonstrated in a 3-minute demo video

---

## Coding Standards

* Use TypeScript everywhere possible
* Prefer server components where appropriate
* Use async/await
* Write reusable components
* Follow SOLID principles
* Avoid code duplication

---

## Documentation Standards

Every major feature must include:
* Purpose
* Architecture
* API usage
* Setup instructions
* Example workflows

Documentation is considered part of the product.

---

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
