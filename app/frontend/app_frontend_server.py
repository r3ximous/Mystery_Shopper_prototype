from fastapi import FastAPI, Request, Response
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

# Custom StaticFiles class with cache-busting headers
class NoCacheStaticFiles(StaticFiles):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        # Add cache-busting headers for CSS and JS files
        if path.endswith(('.css', '.js')):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache" 
            response.headers["Expires"] = "0"
        return response

# Support running when bundled by PyInstaller (resources extracted to _MEIPASS temp dir)
BASE_DIR = getattr(sys, "_MEIPASS", os.path.abspath("."))
TEMPLATES_DIR = os.path.join(BASE_DIR, "app", "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "app", "frontend", "static")

frontend.mount("/static", NoCacheStaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@frontend.get("/", response_class=HTMLResponse)
async def survey_page(request: Request, response: Response):
    from ..backend.core.questions import get_questions, get_questions_by_category
    questions = get_questions()
    categories = get_questions_by_category()
    
    # Add cache-busting headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
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

@frontend.post("/api/submit-survey")
async def submit_survey_frontend(request: Request):
    """Frontend endpoint that forwards to backend survey submission"""
    from fastapi import HTTPException
    
    try:
        # Get the request body
        body = await request.json()
        
        # Forward to the backend API
        from ..backend.schemas.survey import SurveySubmissionIn
        from ..backend.services.survey_service import save_submission
        
        # Validate and process the submission
        submission_data = SurveySubmissionIn(**body)
        result = save_submission(submission_data)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
