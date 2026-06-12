from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from database import get_db
from models.user import User
from repositories import user_repository
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/by-email", response_model=UserResponse)
async def get_user_by_email(
    email: str = Query(..., description="Exact email address to look up"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await user_repository.get_by_email(db, email.lower().strip())
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)
