# main.py
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponses
from pydantic import BaseModel, Field
import logging
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from parser import OllamaTaskParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Task Parser API",
    description="Локальный сервис для парсинга задач из текста",
    version="1.1.0",
)

try:
    parser = OllamaTaskParser(model="qwen2.5:1.5b")
    logger.info(f"Парсер инициализирован (модель: {parser.model})")
except Exception as e:
    logger.error(f"Ошибка инициализации парсера: {e}")
    parser = None


class ParseRequest(BaseModel):
    mode: str = Field(
        default="task",
        description="Режим работы: 'task', 'plan' или 'assign'"
    )
    user_input: Optional[str] = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Текст запроса пользователя (не нужен для mode='assign')"
    )
    horizon_days: Optional[int] = Field(
        default=7,
        ge=1,
        le=30,
        description="Горизонт планирования в днях (только для mode='plan')"
    )
    occurrences: Optional[List[Dict]] = Field(
        None,
        description="Список задач для распределения (только для mode='assign')"
    )
    slots: Optional[List[Dict]] = Field(
        None,
        description="Список свободных слотов (только для mode='assign')"
    )


class TaskResponse(BaseModel):
    task: dict


class PlanResponse(BaseModel):
    action: str
    items: list


# Эндпоинт парсинга
@app.post(
    "/parse",
    summary="Распарсить запрос (задача или план)",
    description="""
    Поддерживает три режима:
    - `mode="task"`: парсинг одиночной задачи
    - `mode="plan"`: извлечение списка регулярных действий для расписания
    - `mode="assign"`: распределение задач (occurrences) по предоставленным слотам (slots)
    """
)
async def parse_endpoint(request: ParseRequest):
    if not parser:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Парсер недоступен"
        )

    try:
        logger.info(f"Парсинг в режиме '{request.mode}': {request.user_input[:50]}...")

        # Вызываем парсер с параметрами
        if request.mode == "assign":
            if not request.occurrences or not request.slots:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Для mode='assign' требуются поля 'occurrences' и 'slots'"
                )
            result = parser.parse(
                user_input="",  # Не нужен для assign
                mode=request.mode,
                occurrences=request.occurrences,
                slots=request.slots
            )
        else:
            result = parser.parse(
                user_input=request.user_input or "",
                mode=request.mode,
                horizon_days=request.horizon_days or 7
            )

        return result

    except Exception as e:
        logger.error(f"Ошибка парсинга: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка парсинга: {str(e)}"
        )


# Эндпоинт здоровья
@app.get("/health")
async def health():
    import requests

    ollama_status = "unknown"
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        ollama_status = "ok" if resp.status_code == 200 else "error"
    except:
        ollama_status = "unavailable"

    return {
        "status": "ok" if parser and ollama_status == "ok" else "degraded",
        "service": "ready" if parser else "uninitialized",
        "ollama": ollama_status,
        "model": parser.model if parser else None,
        "supported_modes": ["task", "plan", "assign"]
    }


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "AI Task Parser API",
        "version": "1.1.0",
        "docs": "/docs",
        "modes": {
            "task": "Парсинг одиночной задачи",
            "plan": "Извлечение списка действий для расписания",
            "assign": "Распределение задач по предоставленным слотам"
        }
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PARSER_PORT", 8000))
    logger.info(f"🚀 Запуск парсера на http://127.0.0.1:{port}")
    logger.info(f"📚 Документация: http://127.0.0.1:{port}/docs")
    uvicorn.run(
        "AIParser:app",
        host="127.0.0.1",
        port=port,
        reload=False,
        log_level="info"
    )