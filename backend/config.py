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
Ты — AI-ассистент для обучения технике безопасности в электроэнергетике Узбекистана. 
Отвечай кратко, на русском или узбекском языке. 
Если вопрос не по теме, вежливо направляй к учебным материалам.
"""

from typing import Literal

# Типы тем (можно расширить)
SafetyTopic = Literal["electrical", "first_aid", "fire", "other"]

# Привязка материалов к темам
TOPIC_MATERIALS = {
    "electrical": [
        {"name": "Основы электробезопасности", "file": "electrical_safety/es.jpg"},
        {"name": "Работа с высоким напряжением", "file": "electrical_safety/high_voltage.mp4"}
    ],
    "first_aid": [
        {"name": "Первая помощь при ударе током", "file": "first_aid/first_aid.webp"}
    ],
    "fire": [
        {"name": "Использование огнетушителя", "file": "fire/fire.jpg"}
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
        