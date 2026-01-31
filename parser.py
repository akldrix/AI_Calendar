import requests
import json
from datetime import datetime, timedelta
from typing import Dict


class OllamaTaskParser:
    def __init__(self, model: str = "qwen2.5:1.5b"):
        self.model = model
        self.api_url = "http://localhost:11434/api/chat"
        self.today = datetime.now().date()

    def parse(self, user_input: str) -> Dict:
        system_prompt = f"""Сегодня: {self.today}
Преобразуй запрос в ВАЛИДНЫЙ JSON по схеме:
{{
  "task": {{
    "title": "строка",
    "date": "ГГГГ-ММ-ДД",
    "start_time": "ЧЧ:ММ",
    "duration_minutes": число
  }}
}}
Правила:
- Дата по умолчанию: завтра ({self.today + timedelta(days=1)})
- Время по умолчанию: 10:00
- Длительность по умолчанию: 30
- Название — кратко (макс. 5 слов)
ОТВЕЧАЙ ТОЛЬКО JSON, без пояснений."""

        try:
            response = requests.post(
                self.api_url,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_input.strip()}
                    ],
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.1}
                },
                timeout=10
            )
            response.raise_for_status()

            result = response.json()
            return json.loads(result["message"]["content"])

        except Exception as e:
            raise RuntimeError(f"Ошибка парсинга через Ollama: {str(e)}")