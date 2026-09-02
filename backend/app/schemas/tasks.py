from typing import Optional

from pydantic import BaseModel


class CreateTask(BaseModel):
	title: str
	start_time: Optional[str] = None
	end_time: Optional[str] = None
	date: str
	category: str
	completed: bool = False
	description: Optional[str] = None


class UpdateTask(BaseModel):
	title: Optional[str] = None
	date: Optional[str] = None
	category: Optional[str] = None
	start_time: Optional[str] = None
	end_time: Optional[str] = None
	completed: bool = None
	description: Optional[str] = None


class TaskResponse(BaseModel):
	id: str
	title: str
	start_time: Optional[str] = None
	end_time: Optional[str] = None
	date: str
	category: str
	description: Optional[str] = None
	completed: bool = False
	model_config = {
		"from_attributes": True
	}
