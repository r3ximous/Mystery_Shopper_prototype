from fastapi import APIRouter, Depends
from ..services.survey_service import list_submissions, basic_metrics, calculate_section_scores
from ..core.security import get_admin_auth
from ..utils.question_validation import get_questions_diagnostics, validate_questions_data
from ..utils.scoring_analysis import analyze_questions_structure, get_q51_dependencies

router = APIRouter()

@router.get("/submissions")
async def get_submissions(_: bool = Depends(get_admin_auth)):
    """Get all submissions with calculated scores for admin dashboard"""
    from ..services.survey_service import _DB, calculate_section_scores
    
    # Convert raw submissions to admin format with calculated scores
    admin_submissions = []
    for submission in _DB:
        score_data = calculate_section_scores(submission)
        admin_submission = {
            "id": submission.id,
            "channel": submission.channel,
            "location_code": submission.location_code,
            "shopper_id": submission.shopper_id,
            "visit_datetime": submission.visit_datetime.isoformat(),
            "created_at": submission.created_at.isoformat(),
            "overall_score": score_data['overall_score'],
            "scores": [{"question_id": s.question_id, "score": s.score, "comment": s.comment} for s in submission.scores],
            "latency_samples": [{"question_id": ls.question_id, "ms": ls.ms} for ls in submission.latency_samples] if submission.latency_samples else [],
            "section_scores": score_data['section_scores']
        }
        admin_submissions.append(admin_submission)
    
    # Sort by most recent first
    admin_submissions.sort(key=lambda x: x["created_at"], reverse=True)
    return admin_submissions

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
