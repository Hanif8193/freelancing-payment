from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import admin, ai, auth, dashboard, invoices, notifications, payments, users
from config import settings

app = FastAPI(
    title="AI Freelancer Payment Agent API",
    description="Backend API for the AI Freelancer Payment Agent — Stablecoin Commerce Stack Challenge",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(notifications.router)
app.include_router(ai.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(users.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
