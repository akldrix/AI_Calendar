import json
import os
from datetime import datetime
from typing import Annotated, List

import httpx
from app.auth import current_active_user
from app.database import get_async_session
from app.models import Task, User
from app.schemas.tasks import CreateTask, TaskFromTextRequest, TaskResponse, UpdateTask
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Response, status
from fastapi.params import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

router = APIRouter(tags=["Tasks"], redirect_slashes=False)

OLLAMA_HOST = os.getenv("OLLAMA_HOST")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
		task_data: CreateTask,
		session: Annotated[AsyncSession, Depends(get_async_session)],
		user: Annotated[User, Depends(current_active_user)],
):
	task_dict = task_data.model_dump()
	task_dict["user_id"] = user.id
	task = Task(**task_dict)
	session.add(task)
	await session.commit()
	await session.refresh(task)
	return task


@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
		session: Annotated[AsyncSession, Depends(get_async_session)],
		user: Annotated[User, Depends(current_active_user)],
):
	query = select(Task).where(Task.user_id == user.id)
	result = await session.execute(query)
	tasks = result.scalars().all()

	return tasks


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
		task_id: str,
		session: Annotated[AsyncSession, Depends(get_async_session)],
		user: Annotated[User, Depends(current_active_user)],
):
	query = select(Task).where(Task.id == task_id, Task.user_id == user.id)
	result = await session.execute(query)
	task = result.scalar_one_or_none()

	if not task:
		raise HTTPException(status_code=404, detail="Task not found")
	return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def change_task(
		task_id: str,
		task_data: UpdateTask,
		session: Annotated[AsyncSession, Depends(get_async_session)],
		user: Annotated[User, Depends(current_active_user)],
):
	result = await session.execute(
		select(Task).where(Task.id == task_id, Task.user_id == user.id)
	)

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
async def delete_task(
		task_id: str,
		session: Annotated[AsyncSession, Depends(get_async_session)],
		user: Annotated[User, Depends(current_active_user)],
):
	query = select(Task).where(Task.id == task_id, Task.user_id == user.id)

	result = await session.execute(query)

	task = result.scalar_one_or_none()

	if not task:
		raise HTTPException(status_code=404, detail="Task not found")
	await session.delete(task)
	await session.commit()
	return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/tasks/from-text", response_model=TaskResponse)
async def create_task_from_text(
		request: TaskFromTextRequest,
		user: Annotated[User, Depends(current_active_user)],
		session: Annotated[AsyncSession, Depends(get_async_session)],
):
	today = datetime.now().strftime("%Y-%m-%d")
	system_prompt = (
		"You are an AI task parser. Extract task details from the user text and output ONLY a valid JSON object. "
		"Do not include any explanations, markdown formatting, or greetings.\n"
		f"Current date: {today} (use this to calculate relative dates like 'tomorrow', 'next week').\n\n"
		"Rules:\n"
		"1. title: Short, clean task name. EXCLUDE temporal words like 'tomorrow', 'today', times.\n"
		"2. date: YYYY-MM-DD format calculated from current date. Use null if not specified.\n"
		"3. start_time / end_time: HH:MM format (24-hour) or null.\n"
		"4. category: Strictly one of ['work', 'self', 'home'] based on context:\n"
		"   - 'work': jobs, meetings, coding, study, business, tasks.\n"
		"   - 'self': gym, doctors, hobbies, personal care, rest, haircut.\n"
		"   - 'home': cleaning, grocery shopping, cooking, chores, repairs.\n\n"
		"Example 1:\n"
		"User text: 'Купить продукты завтра в 18:00'\n"
		'Output: {"title": "Купить продукты", "description": null, "date": "2026-09-05", "start_time": "18:00", '
		'"end_time": null, "category": "home"}\n\n'
		"Example 2:\n"
		"User text: 'Сделать отчет по работе в пятницу'\n"
		'Output: {"title": "Сделать отчет по работе", "description": null, "date": "2026-09-04", "start_time": null, '
		'"end_time": null, "category": "work"}'
		"Example 3:\n"
		"User text: 'Пропылесосить квартиру в следующий понедельник'\n"
		'Output: {"title": "Пропылесосить квартиру в следующий понедельник", "description": null, '
		'"date": "2026-09-07", "start_time": null, "end_time": null, "category": "home"}'
	)
	ollama_payload = {
		"model": OLLAMA_MODEL,
		"prompt": f"{system_prompt}\n\nUser: {request.prompt}",
		"stream": False,
		"format": "json",
	}

	async with httpx.AsyncClient(timeout=30.0) as client:
		try:
			response = await client.post(
				f"{OLLAMA_HOST}/api/generate", json=ollama_payload
			)
			response.raise_for_status()
		except httpx.RequestError as e:
			raise HTTPException(
				status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
			)

	try:
		ollama_data = response.json()
		response_text = ollama_data.get("response", "")

		task_data = json.loads(response_text)

	except json.JSONDecodeError as e:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
			detail=str(e),
		)

	new_task = Task(
		title=task_data.get("title", "Новая задача"),
		description=task_data.get("description"),
		date=task_data.get("date") or today,
		start_time=task_data.get("start_time"),
		end_time=task_data.get("end_time"),
		category=task_data.get("category") or "self",
		completed=False,
		user_id=user.id,
	)

	session.add(new_task)
	await session.commit()
	await session.refresh(new_task)

	return new_task
