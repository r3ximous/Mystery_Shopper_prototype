from datetime import datetime
from ..schemas.survey import SurveySubmissionIn, SurveySubmissionOut
from ..core.security import sanitize_text
from typing import List, Dict, Any

_DB: List[SurveySubmissionOut] = []
_COUNTER = 1

QUESTIONS = {
    "Q1": "Greeting professionalism",
    "Q2": "Wait time satisfaction",
    "Q3": "Resolution effectiveness",
    "Q4": "Facility cleanliness",
    "Q5": "Overall experience"
}

CHANNEL_WEIGHTS = {
    "CALL_CENTER": 1.0,
    "ON_SITE": 1.1,
    "WEB": 0.9,
    "MOBILE_APP": 1.0,
}

ALLOWED_CHANNELS = {"CALL_CENTER","ON_SITE","WEB","MOBILE_APP"}

def save_submission(payload: SurveySubmissionIn) -> SurveySubmissionOut:
    global _COUNTER
    # Basic validation: ensure all question ids exist
    for qs in payload.scores:
        if qs.question_id not in QUESTIONS:
            raise ValueError(f"Invalid question id: {qs.question_id}")
    if payload.channel not in ALLOWED_CHANNELS:
        raise ValueError("Unsupported channel")
    # Additional sanitization safeguard (schema already sanitized identifiers)
    payload.location_code = sanitize_text(payload.location_code)
    payload.shopper_id = sanitize_text(payload.shopper_id)
    submission = SurveySubmissionOut(
        id=_COUNTER,
        created_at=datetime.utcnow(),
        **payload.model_dump()
    )
    _DB.append(submission)
    _COUNTER += 1
    return submission

def list_submissions() -> List[SurveySubmissionOut]:
    return _DB

def basic_metrics() -> Dict[str, Any]:
    if not _DB:
        return {"total": 0, "avg_score": None, "channel_breakdown": {}}
    total_scores = 0
    count_scores = 0
    channel_scores: Dict[str, list] = {}
    for sub in _DB:
        weight = CHANNEL_WEIGHTS.get(sub.channel.upper(), 1.0)
        for qs in sub.scores:
            total_scores += qs.score * weight
            count_scores += 1
            channel_scores.setdefault(sub.channel, []).append(qs.score)
    avg = round(total_scores / count_scores, 2) if count_scores else None
    channel_breakdown = {ch: round(sum(vals)/len(vals), 2) for ch, vals in channel_scores.items()}
    return {"total": len(_DB), "avg_score": avg, "channel_breakdown": channel_breakdown}
