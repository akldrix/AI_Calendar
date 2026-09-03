from fastapi import FastAPI
from app.routes import tasks
from app.database import engine
from app.models import Base, Task
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.auth import fastapi_users, auth_backend
from app.schemas.users import UserRead, UserCreate


@asynccontextmanager
async def lifespan(app: FastAPI):
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)

	yield

	await engine.dispose()


fastapi = FastAPI(lifespan=lifespan)

fastapi.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost",
	               "http://localhost:80",
	               "http://localhost:5173",
	               "http://localhost:3000"],
	allow_credentials=False,
	allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allow_headers=["*"],
)

fastapi.include_router(tasks.router)
fastapi.include_router(
	fastapi_users.get_auth_router(auth_backend),
	prefix="/auth/jwt",
	tags=["auth"],
)
fastapi.include_router(
	fastapi_users.get_register_router(UserRead, UserCreate),
	prefix="/auth",
	tags=["auth"],
)
