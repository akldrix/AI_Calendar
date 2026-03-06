from typing import Dict, Optional
import requests
import json
from datetime import datetime, timedelta


class OllamaTaskParser:
    ALLOWED_CATEGORIES = ["work", "home", "self"]

    def __init__(self, model: str = "qwen2.5:1.5b"):
        self.model = model
        self.api_url = "http://localhost:11434/api/chat"
        self.today = datetime.now().date()

    def _normalize_category(self, raw: Optional[str]) -> str:
        if not raw:
            return "work"

        s = raw.strip().lower()

        work = {
            "work", "job", "office",
            "работа", "офис",
            "учёба", "учеба", "study", "универ", "университет",
        }
        home = {
            "home", "house",
            "дом", "семья", "быт", "хозяйство", "уборка", "готовка",
        }
        self_dev = {
            "self", "self-dev", "selfdevelopment",
            "саморазвитие", "развитие",
            "спорт", "тренировка", "fitness", "health",
            "чтение", "курс", "обучение",
        }

        if s in work:
            return "work"
        if s in home:
            return "home"
        if s in self_dev:
            return "self"

        return "work"

    def parse(self, user_input: str) -> Dict:
        system_prompt = f"""Сегодня: {self.today}
Преобразуй запрос в ВАЛИДНЫЙ JSON по схеме:
{{
  "task": {{
    "title": "строка",
    "date": "ГГГГ-ММ-ДД",
    "start_time": "ЧЧ:ММ",
    "duration_minutes": число,
    "category": "ОДНА из: {self.ALLOWED_CATEGORIES}",
    "completed": true/false
  }}
}}
Правила:
- Дата по умолчанию: завтра ({self.today + timedelta(days=1)})
- Время по умолчанию: 10:00
- Длительность по умолчанию: 30
- category по умолчанию: "work"
- completed по умолчанию: false
- Название — кратко (макс. 5 слов)
ОТВЕЧАЙ ТОЛЬКО JSON, без пояснений."""

        response = requests.post(
            self.api_url,
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input.strip()},
                ],
                "format": "json",
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=20,
        )
        response.raise_for_status()

        result = response.json()
        data = json.loads(result["message"]["content"])
        task = data.get("task", {})

        if not task.get("date"):
            task["date"] = str(self.today + timedelta(days=1))
        if not task.get("start_time"):
            task["start_time"] = "10:00"
        if not task.get("duration_minutes"):
            task["duration_minutes"] = 30

        task["category"] = self._normalize_category(task.get("category"))

        if task.get("completed") is None:
            task["completed"] = False

        start_dt = datetime.strptime(task["date"] + " " + task["start_time"], "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(minutes=int(task["duration_minutes"]))
        task["end_time"] = end_dt.strftime("%H:%M")

        task.pop("duration_minutes", None)
        return {"task": task}
