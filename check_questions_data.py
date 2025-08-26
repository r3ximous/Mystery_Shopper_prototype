"""
Check what data is being passed to the frontend
"""

import sys
sys.path.append('c:\\Users\\Administrator\\Documents\\Mystery_Shopper_prototype')

from app.backend.core.questions import get_questions
import json

def check_questions_data():
    print("Checking questions data passed to frontend...")
    
    questions = get_questions()
    print(f"Total questions: {len(questions)}")
    
    conditional_questions = [q for q in questions if q.get('has_conditions', False)]
    print(f"Questions with conditions: {len(conditional_questions)}")
    
    print("\nConditional questions found:")
    for q in conditional_questions[:10]:  # Show first 10
        print(f"  {q['id']}: has_conditions={q['has_conditions']}, conditions='{q.get('conditions', '')}'")
    
    if len(conditional_questions) > 10:
        print(f"  ... and {len(conditional_questions) - 10} more")
    
    # Check specific Q51 dependencies
    q51_deps = [q for q in questions if q.get('conditions', '').lower().find('q51') != -1]
    print(f"\nQ51 dependent questions: {len(q51_deps)}")
    for q in q51_deps:
        print(f"  {q['id']}: {q.get('conditions', '')}")

if __name__ == "__main__":
    check_questions_data()