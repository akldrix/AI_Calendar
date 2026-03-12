from typing import Dict, Optional, List
import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict


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

    def parse(self, user_input: str, mode: str = "task", horizon_days: int = 7,  occurrences: List[Dict] = None, slots: List[Dict] = None) -> Dict:
        """
        Парсит запрос пользователя в зависимости от режима:
        - mode="task": одиночная задача (текущая логика)
        - mode="plan": извлечение списка регулярных действий для планирования
        """
        if mode == "assign":
            return self._assign_occurrences_to_slots(occurrences, slots)
        elif mode == "plan":
            return self._parse_plan(user_input, horizon_days)
        else:  # mode == "task" (по умолчанию)
            return self._parse_single_task(user_input)

    def _parse_single_task(self, user_input: str) -> Dict:
        """Текущая логика для парсинга одиночной задачи"""
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

    def _parse_plan(self, user_input: str, horizon_days: int) -> Dict:
        """Новая логика: извлечение списка действий для расписания с умными дефолтами"""
        system_prompt = f"""Сегодня: {self.today}
    Горизонт планирования: {horizon_days} дней

    Извлеки из запроса пользователя список РЕГУЛЯРНЫХ действий для расписания.
    Верни ВАЛИДНЫЙ JSON по схеме:
    {{
      "action": "plan",
      "items": [
        {{
          "id": "уникальный_короткий_id_на_английском (без пробелов)",
          "title": "название действия на русском",
          "category": "ОДНА из: {self.ALLOWED_CATEGORIES}",
          "duration_minutes": число_в_минутах,
          "count_total": общее_количество_повторений_за_{horizon_days}_дней
        }}
      ]
    }}

    Правила ДЛЯ ДЕФОЛТНЫХ ЗНАЧЕНИЙ (если пользователь не указал явно):
    - Спорт/бег/тренировка → duration_minutes: 45, count_total: {max(2, horizon_days // 3)}
    - Чтение/книга/курс → duration_minutes: 30, count_total: {horizon_days}
    - Магазин/уборка/быт → duration_minutes: 45, count_total: {max(1, horizon_days // 7 * 2)}
    - Работа/встреча → duration_minutes: 60, count_total: {max(3, horizon_days // 7 * 5)}
    - Любая другая активность → duration_minutes: 30, count_total: {max(1, horizon_days // 2)}

    Дополнительные правила:
    1. Извлекай ТОЛЬКО действия для регулярного выполнения
    2. Одноразовые задачи (сходить в магазин завтра) НЕ включай в список
    3. Для каждого действия:
       - id: короткий уникальный идентификатор на английском (например: "run", "reading", "shopping")
       - title: краткое название на русском (макс. 3 слова)
       - category: определи категорию (бег/спорт → "self", уборка → "home", работа → "work")
       - duration_minutes: реалистичная длительность в минутах
       - count_total: количество повторений за {horizon_days} дней
    4. Если частота не указана явно — предположи разумную (ежедневно → {horizon_days} раз, 2 раза в неделю → ~{horizon_days//7*2} раза)
    5. ОТВЕЧАЙ ТОЛЬКО ВАЛИДНЫМ JSON, без пояснений."""

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
                "options": {"temperature": 0.3},
            },
            timeout=25,
        )
        response.raise_for_status()

        result = response.json()
        data = json.loads(result["message"]["content"])

        # Постобработка с УМНЫМИ ДЕФОЛТАМИ
        items = data.get("items", [])
        processed_items = []

        for idx, item in enumerate(items):
            # Генерация уникального ID, если отсутствует
            item_id = item.get("id")
            if not item_id or not isinstance(item_id, str) or " " in item_id:
                base_id = item.get("title", f"item_{idx}").lower().replace(" ", "_")
                item_id = ''.join(c for c in base_id if c.isalnum() or c in '_-')[:20] or f"item_{idx}"

            # Нормализация категории
            category = self._normalize_category(item.get("category"))

            # Умные дефолты для длительности в зависимости от категории
            duration = item.get("duration_minutes")
            if not isinstance(duration, (int, float)) or duration < 5 or duration > 480:
                duration_defaults = {
                    "self": 45 if "бег" in item.get("title", "").lower() or "спорт" in item.get("title",
                                                                                                "").lower() else 30,
                    "home": 45,
                    "work": 60
                }
                duration = duration_defaults.get(category, 30)

            # Умные дефолты для количества повторений
            count = item.get("count_total")
            if not isinstance(count, int) or count < 1 or count > horizon_days * 3:
                count_defaults = {
                    "self": max(2, horizon_days // 3),  # Спорт 2-3 раза в неделю
                    "home": max(1, horizon_days // 7 * 2),  # Быт 1-2 раза в неделю
                    "work": max(3, horizon_days // 7 * 5)  # Работа будни
                }
                count = count_defaults.get(category, max(1, horizon_days // 2))

            # Финальная валидация границ
            duration = max(5, min(int(duration), 480))  # 5 мин - 8 часов
            count = max(1, min(int(count), horizon_days * 3))  # Не больше 3х в день

            processed_items.append({
                "id": item_id,
                "title": item.get("title", "Без названия")[:50],
                "category": category,
                "duration_minutes": duration,
                "count_total": count
            })

        # Если модель ничего не вернула — создадим базовый план на основе ключевых слов
        if not processed_items:
            keywords = user_input.lower()
            fallback_items = []

            if any(word in keywords for word in ["бег", "спорт", "тренировка", "фитнес", "run", "sport"]):
                fallback_items.append({
                    "id": "run",
                    "title": "Бег",
                    "category": "self",
                    "duration_minutes": 45,
                    "count_total": max(2, horizon_days // 3)
                })

            if any(word in keywords for word in ["чита", "книг", "курс", "обучение", "read", "study"]):
                fallback_items.append({
                    "id": "reading",
                    "title": "Чтение",
                    "category": "self",
                    "duration_minutes": 30,
                    "count_total": horizon_days  # Ежедневно
                })

            if any(word in keywords for word in ["магазин", "покупк", "уборк", "готовк", "быт", "shop", "clean"]):
                fallback_items.append({
                    "id": "shopping",
                    "title": "Магазин",
                    "category": "home",
                    "duration_minutes": 45,
                    "count_total": max(1, horizon_days // 7 * 2)
                })

            if fallback_items:
                processed_items = fallback_items
            else:
                # Абсолютный минимум — одна универсальная задача
                processed_items = [{
                    "id": "default_task",
                    "title": "Полезное занятие",
                    "category": "self",
                    "duration_minutes": 30,
                    "count_total": max(1, horizon_days // 2)
                }]

        return {
            "action": "plan",
            "items": processed_items
        }

    def _assign_occurrences_to_slots(self, occurrences: List[Dict], slots: List[Dict]) -> Dict:
        """
        Распределяет задачи (occurrences) по предоставленным слотам (slots)

        Правила:
        1. Слот используется только один раз (no_duplicate_slot = true)
        2. Длительность должна совпадать точно (duration_minutes)
        3. Задачи с одинаковым базовым именем (до #) распределяются равномерно по дням
        4. Нельзя придумывать время - только предоставленные слоты (use_only_given_slots = true)
        """
        # Группируем задачи по базовому имени (например, все "run#1", "run#2" → группа "run")
        groups = defaultdict(list)
        for occ in occurrences:
            base_name = occ["occ_id"].split("#")[0]
            groups[base_name].append(occ)

        # Парсим слоты и группируем по дате
        parsed_slots = []
        slots_by_date = defaultdict(list)

        for slot in slots:
            start_dt = datetime.fromisoformat(slot["start"].replace("Z", "+00:00"))
            date_key = start_dt.date().isoformat()

            parsed_slots.append({
                "id": slot["id"],
                "start": slot["start"],
                "end": slot["end"],
                "duration_minutes": slot["duration_minutes"],
                "date": date_key,
                "datetime": start_dt
            })
            slots_by_date[date_key].append({
                "id": slot["id"],
                "start": slot["start"],
                "end": slot["end"],
                "duration_minutes": slot["duration_minutes"],
                "datetime": start_dt
            })

        # Сортируем слоты по дате и времени
        for date in slots_by_date:
            slots_by_date[date].sort(key=lambda x: x["datetime"])

        assignments = []
        unscheduled = []
        used_slot_ids = set()

        # Обрабатываем каждую группу задач (например, все "бег" вместе)
        for base_name, group_occurrences in groups.items():
            # Сортируем задачи в группе по номеру (run#1, run#2, ...)
            group_occurrences.sort(key=lambda x: int(x["occ_id"].split("#")[1]) if "#" in x["occ_id"] else 0)

            # Получаем уникальные даты из слотов
            available_dates = sorted(slots_by_date.keys())

            # Распределяем задачи группы равномерно по дням
            num_tasks = len(group_occurrences)
            num_days = len(available_dates)

            if num_tasks == 0:
                continue

            # Если задач больше, чем дней - распределяем по кругу
            # Если дней больше - используем равномерно распределённые дни
            assigned_dates = []

            if num_tasks <= num_days:
                # Равномерно распределяем по доступным дням
                step = max(1, num_days // num_tasks)
                for i in range(num_tasks):
                    date_idx = min(i * step, num_days - 1)
                    assigned_dates.append(available_dates[date_idx])
            else:
                # Задач больше, чем дней - распределяем по кругу
                for i in range(num_tasks):
                    date_idx = i % num_days
                    assigned_dates.append(available_dates[date_idx])

            # Назначаем каждую задачу на свой день
            for occ, target_date in zip(group_occurrences, assigned_dates):
                duration_needed = occ["duration_minutes"]
                assigned = False

                # Ищем подходящий слот на целевой дате
                if target_date in slots_by_date:
                    for slot in slots_by_date[target_date]:
                        # Проверяем: длительность совпадает И слот не использован
                        if (slot["duration_minutes"] == duration_needed and
                                slot["id"] not in used_slot_ids):
                            assignments.append({
                                "occ_id": occ["occ_id"],
                                "slot_id": slot["id"]
                            })
                            used_slot_ids.add(slot["id"])
                            assigned = True
                            break

                # Если не нашли на целевой дате - ищем в других днях
                if not assigned:
                    for date in available_dates:
                        if date == target_date:
                            continue
                        for slot in slots_by_date.get(date, []):
                            if (slot["duration_minutes"] == duration_needed and
                                    slot["id"] not in used_slot_ids):
                                assignments.append({
                                    "occ_id": occ["occ_id"],
                                    "slot_id": slot["id"]
                                })
                                used_slot_ids.add(slot["id"])
                                assigned = True
                                break
                        if assigned:
                            break

                # Если всё ещё не назначено - в незапланированные
                if not assigned:
                    unscheduled.append({
                        "occ_id": occ["occ_id"],
                        "reason": "no_matching_slot"
                    })

        return {
            "action": "assign",
            "assignments": assignments,
            "unscheduled": unscheduled
        }