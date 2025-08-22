#!/usr/bin/env python3
"""
Check what questions are in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.backend.database import SessionLocal
from app.backend.services.question_service import QuestionService

def check_questions():
    """Check what questions are available in the database"""
    db = SessionLocal()
    try:
        question_service = QuestionService(db)
        questions = question_service.get_active_questions()
        
        print("🔍 Questions in database:")
        for q in questions:
            print(f"  - ID: {q['id']}, Code: {q['code']}, Text: {q['text']}")
        
        print(f"\n📊 Total questions: {len(questions)}")
        return questions
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_questions()
