---
name: add-claude-chat-interface
description: Add streaming Claude AI chat interface to Next.js dashboard
metadata:
  type: general
  stage: green
  date: 2026-06-13
  surface: agent
  model: claude-sonnet-4-6
  feature: chat
  branch: main
  user: Hanif
  command: /claude-api
  labels: ["claude-api", "typescript", "nextjs", "streaming", "chat"]
  links:
    spec: null
    ticket: null
    adr: null
    pr: null
---

## Prompt

"add a chat interface that calls Claude"

## Response

Created a streaming Claude AI chat interface in the Next.js 15 frontend:

**Files created/modified:**
- `frontend/app/api/chat/route.ts` — Next.js API route; calls Claude `claude-opus-4-7` with adaptive thinking and streams the response as plain text
- `frontend/app/(dashboard)/chat/page.tsx` — Chat UI with message bubbles, streaming token display, Enter-to-send, and empty state
- `frontend/components/layout/Sidebar.tsx` — Added "AI Chat" nav item (visible to all roles)
- `frontend/app/(dashboard)/layout.tsx` — Added `/chat` to pageTitles map
- `frontend/package.json` — Added `@anthropic-ai/sdk` dependency
- `frontend/.env.local` — Added `ANTHROPIC_API_KEY` placeholder

**Key decisions:**
- API route pattern keeps the API key server-side (never exposed to browser)
- Streaming via `ReadableStream` + `content_block_delta` events for real-time output
- Adaptive thinking (`thinking: {type: "adaptive"}`) enabled on Opus 4.7

## Outcome

TypeScript type-check passed clean (`tsc --noEmit` exit 0). Feature ready after replacing `ANTHROPIC_API_KEY` placeholder in `.env.local`.
