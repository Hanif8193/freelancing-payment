import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user, require_roles
from database import get_db
from models.user import User, UserRole
from repositories import transaction_repository, user_repository
from schemas.auth import UserResponse
from schemas.payment import TransactionResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])

_admin_only = require_roles(UserRole.ADMIN)


@router.get("/users", response_model=list[UserResponse])
async def list_all_users(
    _: User = Depends(_admin_only),
    db: AsyncSession = Depends(get_db),
):
    users = await user_repository.get_all(db)
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/users/{user_id}/toggle-active", response_model=UserResponse)
async def toggle_user_active(
    user_id: uuid.UUID,
    _: User = Depends(_admin_only),
    db: AsyncSession = Depends(get_db),
):
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated = await user_repository.update(db, user_id, {"is_active": not user.is_active})
    return UserResponse.model_validate(updated)


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_all_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(_admin_only),
    db: AsyncSession = Depends(get_db),
):
    items, _ = await transaction_repository.get_all(db, page, limit)
    return [TransactionResponse.model_validate(t) for t in items]
