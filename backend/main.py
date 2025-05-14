from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from .config import model, SAFETY_PROMPT, SafetyTopic, detect_topic, TOPIC_MATERIALS
import os
from fastapi.responses import StreamingResponse

app = FastAPI()

# Монтируем статику (HTML/CSS/JS)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

class ChatMessage(BaseModel):
    text: str
    user_id: str  # Можно добавить аутентификацию

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("backend/static/index.html", "r", encoding="utf-8") as f:  # Явное указание кодировки
        return HTMLResponse(content=f.read(), media_type="text/html; charset=utf-8")

@app.post("/api/chat")
async def chat(message: ChatMessage):
    try:
        response = model.generate_content(
            SAFETY_PROMPT + f"\nВопрос: {message.text}"
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Запуск: uvicorn main:app --reload
@app.post("/api/detect-topic")
async def api_detect_topic(message: ChatMessage):
    topic = detect_topic(message.text)
    return {"topic": topic}

@app.get("/api/materials/{topic}")
async def get_materials_by_topic(topic: SafetyTopic):
    if topic not in TOPIC_MATERIALS:
        return []
    return TOPIC_MATERIALS[topic]

@app.get("/api/materials/{topic}")
async def get_materials(topic: SafetyTopic):
   return get_topic_materials(topic)

@app.post("/api/chat-stream")
async def chat_stream(message: ChatMessage):
    async def generate():
        response = model.generate_content(
            SAFETY_PROMPT + f"\nВопрос: {message.text}",
            stream=True
        )
        for chunk in response:
            yield f"data: {chunk.text}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")