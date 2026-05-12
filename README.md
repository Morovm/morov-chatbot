# Morov Chatbot (نمونه اولیه 3 روزه)

این پروژه یک چت بات سازمانی فارسی با معماری RAG است که کاملا به صورت محلی اجرا می شود.

## ساختار پروژه

- `company_data.txt`: منبع اصلی دانش سازمانی برای بازیابی
- `backend/app.py`: بک اند FastAPI شامل API های `ingest`، `chat` و `history`
- `backend/requirements.txt`: وابستگی های بک اند
- `components/chat/*`: رابط کاربری چت (فارسی/RTL) و اتصال به API بک اند

## تنظیم Ollama (الزامی)

در این نسخه، بک اند برای inference کاملا به Ollama متصل می شود.

- آدرس پیش فرض Ollama: `http://localhost:11434`
- مدل چت: `mistral:7b-instruct`
- مدل embedding: `nomic-embed-text`
- لینک دانلود Ollama برای ویندوز: [ollama.com/download/windows](https://ollama.com/download/windows)

قبل از اجرای پروژه، این مراحل را یک بار انجام دهید:

1. Ollama را نصب کنید و مطمئن شوید در پس زمینه اجراست (System Tray).
2. مدل های لازم را pull کنید:

```bash
ollama pull mistral:7b-instruct
ollama pull nomic-embed-text
```

سپس وابستگی های بک اند را نصب کنید:

```bash
cd backend
pip install -r requirements.txt
```

## نحوه اجرا

### اجرای بک اند

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

### اجرای فرانت اند

```bash
cd frontend
npm install
npm run dev
```

> توجه: در این پروژه فرانت اند در ریشه Next.js قرار دارد. اگر پوشه جداگانه `frontend` ندارید، دستورات را در ریشه پروژه اجرا کنید.

## پیکربندی فرانت اند برای اتصال به بک اند

فرانت اند به طور پیش فرض به `http://localhost:8000` متصل می شود.

در صورت نیاز می توانید متغیر زیر را تنظیم کنید:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## API های اصلی

- `POST /ingest`
  - بدون فایل: خواندن خودکار `company_data.txt`
  - با فایل: ingest سند آپلودی
- `POST /chat`
  - دریافت پیام کاربر
  - بازیابی برترین قطعات از ChromaDB
  - تولید پاسخ با Ollama و مدل `mistral:7b-instruct`
  - استریم پاسخ به صورت SSE
- `GET /history`
  - نمایش تاریخچه گفتگوها در حافظه

## نکات نمونه اولیه

- این نسخه برای پروتوتایپ 3 روزه طراحی شده است.
- تاریخچه گفتگو در حافظه نگه داری می شود و پایدار نیست.
- از LangChain یا LlamaIndex استفاده نشده است.
- Ollama در این نسخه الزامی است.
