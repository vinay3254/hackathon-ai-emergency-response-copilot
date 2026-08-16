from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import transcribe, classify, process

app = FastAPI(
    title="AI Emergency Response Copilot - ML Engine",
    description="Standalone inference engine for STT, reasoning, and severity scoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe.router, prefix="/transcribe", tags=["transcription"])
app.include_router(classify.router, prefix="/classify", tags=["classification"])
app.include_router(process.router, prefix="/process", tags=["pipeline"])

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "ml-engine",
        "models": ["whisper-stt", "claude-reasoning-fallback"]
    }
