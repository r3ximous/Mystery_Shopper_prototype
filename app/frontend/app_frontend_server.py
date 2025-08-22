from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.backend.main import app as api_app
import httpx
import asyncio
import os, sys

frontend = FastAPI(title="Mystery Shopper Frontend")

frontend.mount("/api", api_app)
frontend.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support running when bundled by PyInstaller (resources extracted to _MEIPASS temp dir)
BASE_DIR = getattr(sys, "_MEIPASS", os.path.abspath("."))
TEMPLATES_DIR = os.path.join(BASE_DIR, "app", "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "app", "frontend", "static")

frontend.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

async def get_questions_from_api(language: str = "en"):
    """Get questions dynamically from the API"""
    try:
        # Use the mounted API to get questions
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://127.0.0.1:3000/api/questions?language={language}")
            if response.status_code == 200:
                data = response.json()
                return data.get('questions', get_fallback_questions())
            else:
                print(f"API returned status {response.status_code}, using fallback")
                return get_fallback_questions()
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return get_fallback_questions()

def get_fallback_questions():
    """Fallback questions if API is not available"""
    return [
        {'id': 'SVC_001', 'text_en': 'Staff friendliness and professionalism', 'text_ar': 'ود الموظفين ومهنيتهم', 'weight': 1.2},
        {'id': 'SVC_002', 'text_en': 'Knowledge and helpfulness of staff', 'text_ar': 'معرفة الموظفين ومدى مساعدتهم', 'weight': 1.3},
        {'id': 'SVC_003', 'text_en': 'Communication clarity and language support', 'text_ar': 'وضوح التواصل ودعم اللغة', 'weight': 1.1},
        {'id': 'FAC_001', 'text_en': 'Cleanliness and maintenance of facility', 'text_ar': 'نظافة وصيانة المرفق', 'weight': 1.0},
        {'id': 'FAC_002', 'text_en': 'Accessibility and navigation', 'text_ar': 'إمكانية الوصول والتنقل', 'weight': 0.9},
        {'id': 'EFF_001', 'text_en': 'Waiting time and queue management', 'text_ar': 'وقت الانتظار وإدارة الطوابير', 'weight': 1.4},
        {'id': 'EFF_002', 'text_en': 'Service completion speed and accuracy', 'text_ar': 'سرعة ودقة إنجاز الخدمة', 'weight': 1.3}
    ]

@frontend.get("/", response_class=HTMLResponse)
async def survey_page(request: Request):
    """Survey form with language support"""
    language = request.query_params.get('lang', 'en')
    questions = await get_questions_from_api(language)
    
    return templates.TemplateResponse("survey_form.html", {
        "request": request, 
        "questions": questions,
        "language": language
    })

@frontend.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin_dashboard.html", {"request": request})

@frontend.get("/admin/questions", response_class=HTMLResponse)
async def admin_questions_page(request: Request):
    """Question management admin page"""
    language = request.query_params.get('lang', 'en')
    questions = await get_questions_from_api(language)
    
    return templates.TemplateResponse("admin_questions.html", {
        "request": request,
        "questions": questions,
        "language": language
    })
