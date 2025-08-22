from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_database
from ..schemas.survey import SurveySubmissionIn, SurveySubmissionOut
from ..services.survey_service import save_submission

router = APIRouter()

@router.post("/submit", response_model=SurveySubmissionOut)
async def submit_survey(payload: SurveySubmissionIn, db: Session = Depends(get_database)):
    try:
        submission = save_submission(payload, db)
        return submission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
