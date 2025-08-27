from fastapi import APIRouter, Depends
from ..services.survey_service import list_submissions, basic_metrics, calculate_section_scores
from ..core.security import get_admin_auth
from ..utils.question_validation import get_questions_diagnostics, validate_questions_data
from ..utils.scoring_analysis import analyze_questions_structure, get_q51_dependencies

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

@router.get("/questions/diagnostics")
async def get_questions_diagnostics_endpoint(_: bool = Depends(get_admin_auth)):
    """Get comprehensive diagnostics about questions data"""
    return get_questions_diagnostics()

@router.get("/questions/validation")
async def validate_questions_endpoint(_: bool = Depends(get_admin_auth)):
    """Validate questions data consistency"""
    return validate_questions_data()

@router.get("/questions/structure")
async def get_questions_structure(_: bool = Depends(get_admin_auth)):
    """Analyze questions structure"""
    return analyze_questions_structure()

@router.get("/questions/q51-dependencies")
async def get_q51_dependencies_endpoint(_: bool = Depends(get_admin_auth)):
    """Get all questions that depend on Q51"""
    return get_q51_dependencies()
