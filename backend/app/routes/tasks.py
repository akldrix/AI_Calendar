from typing import Annotated, List
from fastapi import APIRouter, HTTPException, Response, status
from fastapi.params import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_active_user
from app.database import get_async_session
from app.schemas.tasks import TaskResponse, CreateTask, UpdateTask
from app.models import Task, User

router = APIRouter(tags=["Tasks"], redirect_slashes=False)


@router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: CreateTask, session: Annotated[AsyncSession, Depends(get_async_session)],
                      user: Annotated[User, Depends(current_active_user)]):
	task_dict = task_data.model_dump()
	task_dict['user_id'] = user.id
	task = Task(**task_dict)
	session.add(task)
	await session.commit()
	await session.refresh(task)
	return task


@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(session: Annotated[AsyncSession, Depends(get_async_session)],
                    user: Annotated[User, Depends(current_active_user)]):
	query = select(Task).where(Task.user_id == user.id)
	result = await session.execute(query)
	tasks = result.scalars().all()

	return tasks


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, session: Annotated[AsyncSession, Depends(get_async_session)],
                   user: Annotated[User, Depends(current_active_user)]):
	query = select(Task).where(Task.id == task_id, Task.user_id == user.id)
	result = await session.execute(query)
	task = result.scalar_one_or_none()

	if not task:
		raise HTTPException(status_code=404, detail="Task not found")
	return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def change_task(task_id: str, task_data: UpdateTask,
                      session: Annotated[AsyncSession, Depends(get_async_session)],
                      user: Annotated[User, Depends(current_active_user)]):
	result = await session.execute(select(Task).where(Task.id == task_id, Task.user_id == user.id))

	db_task = result.scalar_one_or_none()

	if not db_task:
		raise HTTPException(status_code=404, detail="Task not found")

	updated_task = task_data.model_dump(exclude_unset=True)

	for key, value in updated_task.items():
		setattr(db_task, key, value)

	await session.commit()
	await session.refresh(db_task)

	return db_task


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, session: Annotated[AsyncSession, Depends(get_async_session)],
                      user: Annotated[User, Depends(current_active_user)]):
	query = select(Task).where(Task.id == task_id, Task.user_id == user.id)

	result = await session.execute(query)

	task = result.scalar_one_or_none()

	if not task:
		raise HTTPException(status_code=404, detail="Task not found")
	await session.delete(task)
	await session.commit()
	return Response(status_code=status.HTTP_204_NO_CONTENT)



