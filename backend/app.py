from __future__ import annotations

import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import chromadb
import ollama
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "company_data.txt"
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "morov_company_knowledge"
OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "mistral:7b-instruct"
EMBEDDING_MODEL = "nomic-embed-text"

app = FastAPI(title="Morov Chatbot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

# In-memory history for prototype scope.
chat_history: list[dict[str, Any]] = []


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default")


def split_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\r\n?", "\n", text)
    paragraphs = [p.strip() for p in normalized.split("\n") if p.strip()]
    sentences: list[str] = []
    for paragraph in paragraphs:
        parts = re.split(r"(?<=[\.\!\؟\?؛])\s+", paragraph)
        for part in parts:
            piece = part.strip()
            if piece:
                sentences.append(piece)
    return sentences


def build_chunks(text: str, target_size: int = 700, overlap: int = 100) -> list[str]:
    sentences = split_sentences(text)
    if not sentences:
        return []

    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if not current:
            current = sentence
            continue
        candidate = f"{current} {sentence}"
        if len(candidate) <= target_size:
            current = candidate
        else:
            chunks.append(current)
            overlap_text = current[-overlap:] if len(current) > overlap else current
            current = f"{overlap_text} {sentence}".strip()

    if current:
        chunks.append(current)

    return [chunk.strip() for chunk in chunks if chunk.strip()]


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    for text in texts:
        embedding = ollama.embeddings(model=EMBEDDING_MODEL, prompt=text)["embedding"]
        embeddings.append(embedding)
    return embeddings


def ingest_text(content: str, source_name: str) -> int:
    chunks = build_chunks(content)
    if not chunks:
        raise HTTPException(status_code=400, detail="متن قابل پردازش در سند پیدا نشد.")

    collection.delete(where={"source": source_name})
    embeddings = embed_texts(chunks)
    ids = [f"{source_name}-{idx}-{uuid.uuid4().hex[:8]}" for idx in range(len(chunks))]
    metadatas = [{"source": source_name, "chunk_index": idx} for idx in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
    return len(chunks)


def build_prompt(question: str, contexts: list[str]) -> str:
    context_block = "\n\n---\n\n".join(contexts) if contexts else "هیچ زمینه ای یافت نشد."
    return f"""
تو دستیار سازمانی «مروو چت بات» هستی.
فقط بر اساس زمینه ارائه شده پاسخ بده.
اگر پاسخ در زمینه موجود نیست، خیلی مودبانه بگو که اطلاعات کافی در اسناد شرکت وجود ندارد.
از حدس زدن، ارائه اطلاعات خارج از متن و پاسخ عمومی بدون استناد به زمینه خودداری کن.
پاسخ را کاملا فارسی، روشن و خلاصه بنویس.

زمینه:
{context_block}

سوال کاربر:
{question}
""".strip()


def format_sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.on_event("startup")
def bootstrap_ingest() -> None:
    if not DATA_FILE.exists():
        return
    content = DATA_FILE.read_text(encoding="utf-8")
    ingest_text(content, source_name=DATA_FILE.name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(file: UploadFile | None = File(default=None)) -> dict[str, Any]:
    if file:
        raw = await file.read()
        text = raw.decode("utf-8", errors="ignore")
        source_name = file.filename or "uploaded_document.txt"
    else:
        if not DATA_FILE.exists():
            raise HTTPException(status_code=404, detail="فایل company_data.txt پیدا نشد.")
        text = DATA_FILE.read_text(encoding="utf-8")
        source_name = DATA_FILE.name

    chunk_count = ingest_text(text, source_name=source_name)
    return {"status": "success", "source": source_name, "chunks": chunk_count}


@app.post("/chat")
async def chat(payload: ChatRequest) -> StreamingResponse:
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="پیام کاربر خالی است.")

    query_embedding = ollama.embeddings(model=EMBEDDING_MODEL, prompt=user_message)["embedding"]
    result = collection.query(query_embeddings=[query_embedding], n_results=4)
    contexts = (result.get("documents") or [[]])[0]
    prompt = build_prompt(user_message, contexts)
    messages = [{"role": "user", "content": prompt}]

    def event_generator():
        full_text = ""
        yield format_sse({"type": "meta", "retrieved_chunks": len(contexts)})
        stream = ollama.chat(
            model=LLM_MODEL,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            token = chunk.get("message", {}).get("content", "")
            if token:
                full_text += token
                yield format_sse({"type": "token", "content": token})

        chat_history.append(
            {
                "session_id": payload.session_id,
                "question": user_message,
                "answer": full_text.strip(),
                "created_at": datetime.now().isoformat(),
            }
        )
        yield format_sse({"type": "done"})

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/history")
def history() -> dict[str, Any]:
    sessions: dict[str, dict[str, Any]] = {}
    for item in chat_history:
        session_id = item["session_id"]
        created_at = datetime.fromisoformat(item["created_at"])
        if session_id not in sessions:
            sessions[session_id] = {
                "id": session_id,
                "title": item["question"][:30] or "گفتگو",
                "preview": item["question"][:50] or "گفتگو",
                "date": created_at.strftime("%Y-%m-%d"),
                "messages_count": 1,
            }
        else:
            sessions[session_id]["messages_count"] += 1

    ordered = sorted(sessions.values(), key=lambda x: x["date"], reverse=True)
    return {"sessions": ordered, "items": chat_history[-50:]}
