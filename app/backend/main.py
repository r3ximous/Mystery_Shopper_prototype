from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import survey, admin
from .routes.question_routes import router as question_router
from .database import init_database, seed_default_questions

app = FastAPI(title="Mystery Shopper Automation API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(survey.router, prefix="/survey", tags=["survey"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(question_router, prefix="/api", tags=["questions"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed default data"""
    init_database()
    seed_default_questions()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Mystery Shopper API"}
