import os
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path
from typing import List, Dict

load_dotenv()  # Загружаем переменные из .env
MATERIALS_BASE_DIR = "backend/static/materials"


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

# Системный промт для обучения безопасности
SAFETY_PROMPT = """
Ты — аварийный ассистент по электробезопасности Узбекистана. Специализируешься на:
1. Неотложной помощи при поражении током
2. Профилактике электротравм
3. Нормативных документах РУз

⚠️ **Критические правила ответов:**
- При ЧС давай ПОШАГОВЫЙ алгоритм с номером 103
- Выделяй предупреждения знаком ⚠️ в начале сообщения
- Ссылайся на ПБЭЭ РУз и сайт ies-delta.vercel.app
- Используй маркированные списки для инструкций
- Подчеркивай необходимость обесточивания перед помощью

Формат ответов:
1. Экстренные случаи (шаблон):
⚠️ **СРОЧНЫЕ МЕРЫ** (поражение током):
1. Обесточьте! (главное правило)
2. Вызовите 103
3. Проверьте дыхание
4. Начните СЛР при необходимости
▶️ Подробнее: ies-delta.vercel.app/emergency

2. Обычные вопросы:
- Краткий ответ (2-3 предложения)
- Ссылка на раздел сайта
- Рекомендация по профилактике

3. Нормативные вопросы:
- Точная ссылка на пункт ПБЭЭ РУз
- Краткая выдержка
- Ссылка на полный текст

Примеры:
Q: "Что делать при ударе током?"
A: ⚠️ **Немедленно:**
1. ОБЕСТОЧЬТЕ линию (не прикасайтесь голыми руками!)
2. Вызовите 103
3. При отсутствии дыхания - 30 нажатий + 2 вдоха
▶️ Алгоритм СЛР: ies-delta.vercel.app/cpr

Q: "Какие СИЗ использовать?"
A: Для напряжений до 1000В:
• Диэлектрические перчатки (по ПБЭЭ РУз п.4.2.1)
• Изолированный инструмент
• Коврики диэлектрические
🔗 Полный список: ies-delta.vercel.app/ppe

Запрещено:
- Давать медицинские советы кроме СЛР
- Рекомендовать действия без обесточивания
- Цитировать устаревшие нормы
"""

from typing import Literal

# Типы тем (можно расширить)
SafetyTopic = Literal["electrical", "first_aid", "fire", "other"]

# Привязка материалов к темам
TOPIC_MATERIALS = {
    "electrical": [
        {"name": "Работа с высоким напряжением", "file": "electrical/esvid.mp4"},
        {"name": "Основы электробезопасности", "file": "electrical/main.pdf"},
        {"name": "Работа с высоким напряжением", "file": "electrical/esvid.mp4"}
    ],
    "first_aid": [
        {"name": "Правила оказания первой помощи", "file": "first_aid/first_aid.jpg"},
        {"name": "Первая помощь при ударе током", "file": "first_aid/first_aid.webp"},
        {"name": "Основы оказания первой скорой помощи", "file": "first_aid/main.pdf"}
    ],
    "fire": [
        {"name": "Использование огнетушителя", "file": "fire/fire.jpg"},
        {"name": "Основы пожарной безопасности", "file": "fire/main.pdf"}
    ]
}

def detect_topic(text: str) -> SafetyTopic:
    """Определяет тему вопроса пользователя"""
    text_lower = text.lower()
    if "электр" in text_lower or "напряж" in text_lower:
        return "electrical"
    elif "перв" in text_lower or "помощ" in text_lower:
        return "first_aid"
    elif "пожар" in text_lower or "огнетуш" in text_lower:
        return "fire"
    else:
        return "other"

async def generate_emergency_response():
    prompt = f"""
    {SAFETY_PROMPT}
    
    Текущая ситуация: 
    Пользователь сообщил о случае поражения электрическим током на производстве.
    Напряжение установки - 380В, пострадавший без сознания.
    """
    
    response = model.generate_content(prompt)
    return format_for_web(response.text)

def format_for_web(text):
    # Заменяем маркеры на HTML-теги
    text = text.replace("⚠️", '<span class="warning-icon">⚠️</span>')
    text = text.replace("▶️", '<a class="nav-link" href="...">')
    return text