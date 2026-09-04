import uuid
from typing import Optional

from app.database import Base
from app.models.users import User
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_time: Mapped[Optional[str]] = mapped_column(String)
    end_time: Mapped[Optional[str]] = mapped_column(String)
    date: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"), nullable=False)

    user = relationship("User", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "date": self.date,
            "category": self.category,
            "description": self.description,
            "completed": self.completed,
        }
