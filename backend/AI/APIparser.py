# main.py
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import logging
import os

from parser import OllamaTaskParser

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Task Parser API",
    description="Локальный сервис для парсинга задач из текста",
    version="1.0.0"
)

try:
    parser = OllamaTaskParser(model="qwen2.5:1.5b")
    logger.info(f"Парсер инициализирован (модель: {parser.model})")
except Exception as e:
    logger.error(f"Ошибка инициализации парсера: {e}")
    parser = None


class ParseRequest(BaseModel):
    user_input: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Текст запроса пользователя"
    )


class Task(BaseModel):
    title: str = Field(..., description="Название задачи")
    date: str = Field(..., description="Дата в формате ГГГГ-ММ-ДД")
    start_time: str = Field(..., description="Время начала в формате ЧЧ:ММ")
    duration_minutes: int = Field(..., ge=1, le=1440, description="Длительность в минутах")


class ParseResponse(BaseModel):
    task: Task


@app.post(
    "/parse",
    response_model=ParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Распарсить задачу из текста"
)
async def parse_task(request: ParseRequest):
    """
    Преобразует естественный язык в структурированный объект задачи.

    Пример запроса:
    ```json
    {
      "user_input": "Запланируй танцы завтра в 14:00 на час"
    }
    ```

    Пример ответа:
    ```json
    {
      "task": {
        "title": "Танцы",
        "date": "2025-02-16",
        "start_time": "14:00",
        "duration_minutes": 60
      }
    }
    ```
    """
    if not parser:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Парсер недоступен (ошибка инициализации)"
        )

    try:
        logger.info(f"Парсинг запроса: {request.user_input[:50]}...")
        result = parser.parse(request.user_input)

        if not isinstance(result, dict) or "task" not in result:
            raise ValueError("Некорректный формат ответа от парсера")

        return result

    except ValueError as e:
        logger.warning(f"Некорректный запрос: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка в запросе: {str(e)}"
        )
    except RuntimeError as e:
        logger.error(f"Ошибка парсинга: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось распарсить запрос: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Внутренняя ошибка: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка сервера парсера"
        )


@app.get("/health", summary="Проверка работоспособности")
async def health():
    """Проверяет статус сервиса и подключение к Ollama"""
    import requests

    ollama_status = "unknown"
    models = []

    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        if resp.status_code == 200:
            ollama_status = "ok"
            models = [m.get("name") for m in resp.json().get("models", [])]
        else:
            ollama_status = "error"
    except Exception as e:
        logger.error(f"Ollama недоступен: {e}")
        ollama_status = "unavailable"

    return {
        "status": "ok" if parser and ollama_status == "ok" else "degraded",
        "service": "ready" if parser else "uninitialized",
        "ollama": ollama_status,
        "model": parser.model if parser else None,
        "models_available": models
    }


@app.get("/", include_in_schema=False)
async def root():
    """Перенаправление на документацию"""
    return {
        "service": "AI Task Parser API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Запуск сервера
if __name__ == "__main__":
    import uvicorn

    # Определяем порт (можно переопределить через переменную окружения)
    port = int(os.getenv("PARSER_PORT", 8000))

    logger.info(f" Запуск парсера на http://127.0.0.1:{port}")
    logger.info(f" Документация: http://127.0.0.1:{port}/docs")
    logger.info(f"  Статус: http://127.0.0.1:{port}/health")

    # ВАЖНО: только 127.0.0.1 (не 0.0.0.0) — сервис доступен только локально!
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # ← ТОЛЬКО ЛОКАЛЬНЫЙ ДОСТУП
        port=port,
        reload=False,  # reload=False для продакшена
        log_level="info"
    )