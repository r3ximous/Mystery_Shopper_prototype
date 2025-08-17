from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.backend.main import app as api_app

frontend = FastAPI(title="Mystery Shopper Frontend")

frontend.mount("/api", api_app)
frontend.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend.mount("/static", StaticFiles(directory="app/frontend/static"), name="static")
templates = Jinja2Templates(directory="app/frontend/templates")

@frontend.get("/", response_class=HTMLResponse)
async def survey_page(request: Request):
    return templates.TemplateResponse("survey_form.html", {"request": request})

@frontend.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin_dashboard.html", {"request": request})
