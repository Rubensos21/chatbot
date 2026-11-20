from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from ollama import chat

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

# Esta clase debe coincidir EXACTAMENTE con lo que envía Angular
class ChatRequest(BaseModel):
    model: str
    messages: List[Message]

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # Damos formato a los mensajes
    formatted_messages = [{"role": m.role, "content": m.content} for m in req.messages]

    # Hacemos la petición a Ollama
    resp = chat(
        model=req.model,
        messages=formatted_messages
    )
    
    return {"role": "assistant", "content": resp.message.content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)