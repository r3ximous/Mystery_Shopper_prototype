"""
Quick database populator - adds data directly to the running server's memory
Run this while the server is running to add test data
"""

import sys
import os
import random
from datetime import datetime, timedelta

# Add the backend path
sys.path.append(os.path.dirname(__file__))

try:
    from app.backend.services.survey_service import save_submission, list_submissions
    from app.backend.schemas.survey import SurveySubmissionIn, QuestionScore, LatencySample
    print("✅ Successfully imported backend services")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Sample data
LOCATIONS = ["DXB_MAIN", "AUH_CENTRAL", "SHJ_CITY", "RAK_MALL", "FUJ_CENTER", "AJM_PLAZA", "UAQ_SQUARE"]
SHOPPER_IDS = ["MS001", "MS002", "MS003", "MS004", "MS005", "MS006", "MS007", "MS008", "MS009", "MS010"]
CHANNELS = ["CALL_CENTER", "ON_SITE", "WEB", "MOBILE_APP"]
QUESTION_IDS = ["Q0", "Q1", "Q10", "Q11", "Q12", "Q15", "Q16", "Q17", "Q18", "Q19", "Q21", "Q22", "Q23", "Q25", "Q26", "Q27", "Q3", "Q6", "Q9"]

COMMENTS = [
    "Excellent service quality",
    "Staff very helpful and professional", 
    "Clean and organized facility",
    "Quick and efficient process",
    "Average experience, could be better",
    "Some issues with service speed",
    "Facility needs better maintenance"
]

def create_quick_data():
    """Create 50 quick test submissions"""
    print("🎯 Creating quick test data...")
    
    current_count = len(list_submissions())
    print(f"Current submissions in database: {current_count}")
    
    created = 0
    
    # Create 50 varied submissions
    for i in range(50):
        try:
            # Random date in last 60 days
            days_ago = random.randint(0, 60)
            visit_time = datetime.now() - timedelta(
                days=days_ago,
                hours=random.randint(8, 18),
                minutes=random.randint(0, 59)
            )
            
            # Random submission data
            location = random.choice(LOCATIONS)
            shopper = random.choice(SHOPPER_IDS)
            channel = random.choice(CHANNELS)
            
            # Create 10-20 question scores
            scores = []
            num_questions = random.randint(10, 20)
            selected_questions = random.sample(QUESTION_IDS, k=min(num_questions, len(QUESTION_IDS)))
            
            for q_id in selected_questions:
                score = random.randint(1, 5)  # Random score 1-5
                comment = random.choice(COMMENTS + [None, None, None]) if random.random() < 0.2 else None
                
                scores.append(QuestionScore(
                    question_id=q_id,
                    score=score,
                    comment=comment
                ))
            
            # Create submission
            submission_data = SurveySubmissionIn(
                channel=channel,
                location_code=location,
                shopper_id=shopper,
                visit_datetime=visit_time,
                scores=scores,
                latency_samples=[]
            )
            
            # Save to database
            result = save_submission(submission_data)
            created += 1
            
            if (i + 1) % 10 == 0:
                print(f"  Created {i + 1}/50 submissions...")
                
        except Exception as e:
            print(f"  ❌ Error creating submission {i+1}: {e}")
    
    print(f"\n🎉 Successfully created {created} submissions!")
    
    # Verify
    final_count = len(list_submissions())
    print(f"✅ Database now has {final_count} total submissions")
    
    if final_count > 0:
        print(f"\n📊 Sample data:")
        submissions = list_submissions()[:3]  # Show first 3
        for i, sub in enumerate(submissions):
            print(f"  [{i+1}] {sub.location_code} via {sub.channel} - {len(sub.scores)} answers")

if __name__ == "__main__":
    print("🚀 Quick Database Populator")
    print("This adds test data directly to the running server's memory")
    print("-" * 50)
    
    try:
        create_quick_data()
        print("\n✅ Done! Check the admin dashboard now.")
        print("🌐 Admin Dashboard: http://localhost:8000/admin")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
