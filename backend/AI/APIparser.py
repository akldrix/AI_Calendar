# main.py
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import logging
import os
from datetime import datetime, timedelta
from typing import Optional
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
        description="Режим работы: 'task' для одиночной задачи, 'plan' для составления расписания"
    )
    user_input: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Текст запроса пользователя"
    )
    horizon_days: Optional[int] = Field(
        default=7,
        ge=1,
        le=30,
        description="Горизонт планирования в днях (только для mode='plan')"
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
    Поддерживает два режима:
    - `mode="task"`: парсинг одиночной задачи (возвращает структуру задачи)
    - `mode="plan"`: извлечение списка регулярных действий для расписания (возвращает список items)
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
        result = parser.parse(
            user_input=request.user_input,
            mode=request.mode,
            horizon_days=request.horizon_days
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
        "supported_modes": ["task", "plan"]
    }


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "AI Task Parser API",
        "version": "1.1.0",
        "docs": "/docs",
        "modes": {
            "task": "Парсинг одиночной задачи",
            "plan": "Извлечение списка действий для расписания"
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