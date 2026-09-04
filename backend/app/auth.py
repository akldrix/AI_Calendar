import os
import uuid
from typing import Optional

from app.database import get_async_session
from app.models.users import User
from app.utils.email import send_email
from dotenv import load_dotenv
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

SECRET = os.getenv("SECRET", "")


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(
        self, user: User, request: Optional[Request] = None
    ) -> None:
        await self.request_verify(user, request)

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        verification_link = f"http://10.119.66.183/api/auth/confirm?token={token}"
        subject = "Подтверждение верификации"

        body = (
            f"Здравствуйте!\n\n"
            f"Спасибо за регистрацию. Для подтверждения вашей почты перейдите по ссылке:\n"
            f"{verification_link}\n\n"
            f"Или введите этот токен в приложении: {token}"
        )
        try:
            await send_email(user.email, subject, body)
            print(f"Verification email successfully sent to {user.email}")
        except Exception as e:
            print(f"Failed to send email to {user.email}: {e}")


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])
current_active_user = fastapi_users.current_user(active=True)
