from fastapi import APIRouter, Depends
from ..services.survey_service import list_submissions, basic_metrics, calculate_section_scores
from ..core.security import get_admin_auth

router = APIRouter()

@router.get("/submissions")
async def get_submissions(_: bool = Depends(get_admin_auth)):
    return list_submissions()

@router.get("/metrics")
async def get_metrics(_: bool = Depends(get_admin_auth)):
    return basic_metrics()

@router.get("/submissions/{submission_id}/scores")
async def get_submission_scores(submission_id: int, _: bool = Depends(get_admin_auth)):
    """Get detailed section scores for a specific submission"""
    from ..services.survey_service import _DB
    
    submission = next((s for s in _DB if s.id == submission_id), None)
    if not submission:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return calculate_section_scores(submission)
