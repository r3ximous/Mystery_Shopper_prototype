#!/usr/bin/env python3
"""
Direct API test using internal modules
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.backend.schemas.survey import SurveySubmissionIn, QuestionScore, LatencySample
from app.backend.database import get_database, SessionLocal
from app.backend.services.survey_service import save_submission

def test_submission_directly():
    """Test submission using internal service directly"""
    
    # Create test payload using active question IDs
    scores = [
        QuestionScore(question_id="SVC_001", score=4),
        QuestionScore(question_id="SVC_002", score=5),
        QuestionScore(question_id="FAC_001", score=3)  # Now using FAC_001 (Cleanliness) which is active
    ]
    
    latency_samples = [
        LatencySample(question_id="SVC_001", ms=1500.0),
        LatencySample(question_id="SVC_002", ms=2100.0)
    ]
    
    payload = SurveySubmissionIn(
        channel="WEB",
        location_code="TEST-001",
        shopper_id="TESTER-001",
        visit_datetime=datetime.now(),
        scores=scores,
        latency_samples=latency_samples
    )
    
    print("🧪 Testing direct submission...")
    print(f"Payload: {payload.model_dump()}")
    
    # Get database session
    db = SessionLocal()
    try:
        result = save_submission(payload, db)
        print("✅ SUCCESS!")
        print(f"Result: {result}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_submission_directly()
