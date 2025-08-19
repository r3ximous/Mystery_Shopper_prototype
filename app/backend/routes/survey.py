from fastapi import APIRouter, HTTPException
from ..schemas.survey import SurveySubmissionIn, SurveySubmissionOut
from ..services.survey_service import save_submission

router = APIRouter()

@router.post("/submit", response_model=SurveySubmissionOut)
async def submit_survey(payload: SurveySubmissionIn):
    try:
        submission = save_submission(payload)
        return submission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
