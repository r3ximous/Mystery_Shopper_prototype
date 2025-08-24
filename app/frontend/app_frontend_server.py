from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.backend.main import app as api_app
from app.backend.core.questions import get_questions
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

@frontend.get("/", response_class=HTMLResponse)
async def survey_page(request: Request):
    from ..backend.core.questions import get_questions, get_questions_by_category
    questions = get_questions()
    categories = get_questions_by_category()
    return templates.TemplateResponse("survey_form.html", {
        "request": request, 
        "questions": questions,
        "categories": categories
    })

@frontend.get("/simple", response_class=HTMLResponse) 
async def simple_survey_page(request: Request):
    from ..backend.core.questions import get_fallback_questions
    questions = get_fallback_questions()
    categories = {"Basic Questions": questions}  # Simple category structure
    return templates.TemplateResponse("survey_form_comprehensive.html", {
        "request": request,
        "questions": questions,
        "categories": categories
    })

@frontend.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin_dashboard.html", {"request": request})
