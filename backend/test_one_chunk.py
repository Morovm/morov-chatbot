import re, unicodedata, ollama

def clean_chunk_advanced(text: str) -> str:
    text = re.sub(r'[\u200b\u200c\u200d\u200e\u200f\ufeff]', '', text)
    text = re.sub(r'[^\w\s]{4,}', ' ', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = text.replace('\x00', '')
    text = unicodedata.normalize('NFC', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text if len(text) >= 5 else ""

original = "شرکت: راهکارپردازان مروو نسخه سند: 1.0 تاریخ به‌روزرسانی: 1405/02/21 نوع سند: پروفایل سازمانی و راهنمای خدمات ======================================== بخش 1: معرفی شرکت ==============================="
cleaned = clean_chunk_advanced(original)
print("Cleaned text:", cleaned)

try:
    res = ollama.embeddings(model="multilingual-embed", prompt=cleaned)
    print("Success! Length:", len(res["embedding"]))
except Exception as e:
    print("FAILED:", e)