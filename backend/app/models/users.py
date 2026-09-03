from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy.access_token import (
	SQLAlchemyAccessTokenDatabase,
	SQLAlchemyBaseAccessTokenTableUUID,
)

from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import Depends
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base, get_async_session


class User(SQLAlchemyBaseUserTableUUID, Base):
	tasks = relationship("Task", back_populates="user")


class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, Base):
	pass


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
	yield SQLAlchemyUserDatabase(session, User)


async def get_access_token_db(session: AsyncSession = Depends(get_async_session)):
	yield SQLAlchemyAccessTokenDatabase(session, AccessToken)
