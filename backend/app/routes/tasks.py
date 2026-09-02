from typing import Annotated, List

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.params import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.schemas.tasks import TaskResponse, CreateTask, UpdateTask
from app.models import Task

router = APIRouter(tags=["Tasks"], redirect_slashes=False)


@router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: CreateTask, session: Annotated[AsyncSession, Depends(get_async_session)]):
	task = Task(**task_data.model_dump())
	session.add(task)
	await session.commit()
	await session.refresh(task)
	return task


@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(session: Annotated[AsyncSession, Depends(get_async_session)]):
	query = select(Task)
	result = await session.execute(query)
	tasks = result.scalars().all()

	return tasks


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, session: Annotated[AsyncSession, Depends(get_async_session)]):
	query = select(Task).where(Task.id == task_id)
	result = await session.execute(query)
	task = result.scalar_one_or_none()
	return task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def change_task(task_id: str, task_data: UpdateTask, session: Annotated[AsyncSession, Depends(get_async_session)]):
	db_task = await session.get(Task, task_id)

	if db_task is None:
		raise HTTPException(status_code=404, detail="Task not found")

	update_data = task_data.model_dump(exclude_unset=True)

	for key, value in update_data.items():
		setattr(db_task, key, value)

	await session.commit()
	await session.refresh(db_task)

	return db_task

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, session: Annotated[AsyncSession, Depends(get_async_session)]):
	query = select(Task).where(Task.id == task_id)

	result = await session.execute(query)

	task = result.scalar_one_or_none()

	await session.delete(task)
	await session.commit()
	return Response(status_code=status.HTTP_204_NO_CONTENT)