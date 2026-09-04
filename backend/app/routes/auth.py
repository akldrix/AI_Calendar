from typing import Annotated

from app.auth import get_user_manager
from fastapi import APIRouter, HTTPException, status
from fastapi.params import Depends
from fastapi.responses import RedirectResponse
from fastapi_users import BaseUserManager

router = APIRouter()


@router.get("/auth/confirm")
async def confirm_email(
    token: str,
    user_manager: Annotated[BaseUserManager, Depends(get_user_manager)],
):
    try:
        await user_manager.verify(token)
        return RedirectResponse(
            url="http://10.119.66.183/login?verified=true",
            status_code=status.HTTP_303_SEE_OTHER,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Wrong token"
        )
