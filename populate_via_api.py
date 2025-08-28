"""
Populate Database Via API
Creates comprehensive test data by submitting through the actual API endpoints
"""

import json
import random
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Base URL for the API
API_BASE = "http://127.0.0.1:8000"
SUBMIT_ENDPOINT = f"{API_BASE}/api/survey/submit"

# Sample data
LOCATIONS = [
    "DXB_MAIN", "AUH_CENTRAL", "SHJ_CITY", "RAK_MALL", "FUJ_CENTER",
    "AJM_PLAZA", "UAQ_SQUARE", "DXB_MALL", "AUH_MARINA", "SHJ_MEGA"
]

SHOPPERS = [
    "MS001", "MS002", "MS003", "MS004", "MS005", "MS006", "MS007", "MS008",
    "MS009", "MS010", "MS011", "MS012", "MS013", "MS014", "MS015", "MS016",
    "MS017", "MS018", "MS019", "MS020", "MS021", "MS022", "MS023", "MS024"
]

CHANNELS = ["CALL_CENTER", "ON_SITE", "MOBILE_APP", "WEB"]

# Valid question IDs from the questions.csv file
VALID_QUESTION_IDS = [
    'Q0', 'Q1', 'Q3', 'Q6', 'Q9', 'Q10', 'Q11', 'Q12', 'Q15', 'Q16', 'Q17', 
    'Q18', 'Q19', 'Q21', 'Q22', 'Q23', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29', 'Q30'
]

# Conditional question logic - simplified for valid IDs only
CONDITIONAL_QUESTIONS = {
    "Q27": ["Q28", "Q29", "Q30"],  # Service Accessibility triggers sub-questions
}

def generate_realistic_answers(performance_level: str, num_questions: int = 20) -> List[Dict[str, Any]]:
    """Generate realistic survey answers based on performance level"""
    answers = []
    
    # Score distributions by performance level
    score_patterns = {
        "excellent": [4, 5, 5, 5, 4, 5, 5, 4, 5, 5],
        "good": [3, 4, 4, 3, 4, 3, 4, 4, 3, 4],
        "average": [2, 3, 3, 2, 3, 2, 3, 3, 2, 3],
        "poor": [1, 2, 1, 2, 1, 2, 2, 1, 2, 1],
        "mixed": [1, 3, 5, 2, 4, 1, 3, 5, 2, 4]
    }
    
    pattern = score_patterns.get(performance_level, score_patterns["average"])
    
    # Use valid question IDs randomly
    num_questions = min(num_questions, len(VALID_QUESTION_IDS))
    selected_questions = random.sample(VALID_QUESTION_IDS, num_questions)
    
    for i, question_id in enumerate(selected_questions):
        # Cycle through the score pattern
        score = pattern[i % len(pattern)]
        
        answers.append({
            "question_id": question_id,
            "answer_value": score  # Keep this field name for now, will convert later
        })
    
    # Add conditional questions based on triggers
    for trigger_question, dependent_questions in CONDITIONAL_QUESTIONS.items():
        # Check if we have this trigger question
        trigger_answer = next((a for a in answers if a["question_id"] == trigger_question), None)
        if trigger_answer and trigger_answer["answer_value"] >= 3:
            # Add dependent questions if they're not already included
            for dep_q in dependent_questions:
                if dep_q not in [a["question_id"] for a in answers]:
                    score = random.choice([3, 4, 5])  # Conditional questions tend to score higher
                    answers.append({
                        "question_id": dep_q,
                        "answer_value": score
                    })
    
    return answers

def create_submission(
    location: str,
    shopper: str,
    channel: str,
    performance_level: str,
    visit_date: datetime,
    use_voice: bool = False
) -> Dict[str, Any]:
    """Create a single survey submission"""
    
    # Generate realistic number of questions
    num_questions = random.randint(15, 35)
    answers = generate_realistic_answers(performance_level, num_questions)
    
    # Convert answers to the expected schema format
    scores = []
    for answer in answers:
        scores.append({
            "question_id": answer["question_id"],
            "score": answer["answer_value"],  # Changed from answer_value to score
            "comment": None  # Optional field
        })
    
    submission = {
        "location_code": location,  # Changed from location
        "shopper_id": shopper,      # Changed from shopper_name
        "channel": channel,
        "visit_datetime": visit_date.isoformat(),
        "scores": scores            # Changed from question_scores
    }
    
    # Add voice data if requested
    if use_voice:
        submission["latency_samples"] = []  # Changed from voice_samples
        num_voice_samples = random.randint(1, 5)
        
        for i in range(num_voice_samples):
            # Pick a random question from the scores
            question_id = random.choice([s["question_id"] for s in scores])
            submission["latency_samples"].append({
                "question_id": question_id,
                "ms": random.randint(1500, 8000)  # Changed from voice_latency to ms
            })
    
    return submission

def submit_to_api(submission: Dict[str, Any]) -> bool:
    """Submit a single survey to the API"""
    try:
        response = requests.post(SUBMIT_ENDPOINT, json=submission, timeout=10)
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Submission failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Submission error: {e}")
        return False

def create_comprehensive_data():
    """Create comprehensive dummy data via API submissions"""
    
    print("🚀 Mystery Shopper API Database Population")
    print("Creating realistic test data via API submissions...")
    print("=" * 60)
    
    submissions_created = 0
    start_date = datetime.now() - timedelta(days=180)  # 6 months ago
    
    # Main performance distribution
    performance_scenarios = [
        ("excellent", 15),
        ("good", 25), 
        ("average", 25),
        ("poor", 10),
        ("mixed", 5)
    ]
    
    print("📊 Creating main performance distribution...")
    
    for performance_level, count in performance_scenarios:
        print(f"  Creating {count} '{performance_level}' submissions...")
        
        for i in range(count):
            location = random.choice(LOCATIONS)
            shopper = random.choice(SHOPPERS)
            channel = random.choice(CHANNELS)
            
            # Random date within the last 6 months
            days_ago = random.randint(1, 180)
            visit_date = start_date + timedelta(days=days_ago, 
                                              hours=random.randint(8, 20),
                                              minutes=random.randint(0, 59))
            
            # 30% chance of voice samples
            use_voice = random.random() < 0.3
            
            submission = create_submission(location, shopper, channel, performance_level, visit_date, use_voice)
            
            if submit_to_api(submission):
                submissions_created += 1
            else:
                print(f"Failed to submit {performance_level} submission {i+1}")
    
    # Edge cases
    print("🎭 Creating edge case scenarios...")
    
    edge_cases = [
        ("excellent", "Perfect Score scenario"),
        ("poor", "Critical Issues scenario"), 
        ("good", "Voice Power User scenario"),
        ("average", "Weekend Visitor scenario"),
        ("mixed", "Late Night Service scenario")
    ]
    
    for performance, description in edge_cases:
        print(f"  Creating '{description}'...")
        location = random.choice(LOCATIONS)
        shopper = random.choice(SHOPPERS)
        channel = random.choice(CHANNELS)
        
        visit_date = datetime.now() - timedelta(days=random.randint(1, 30))
        use_voice = "Voice" in description
        
        submission = create_submission(location, shopper, channel, performance, visit_date, use_voice)
        
        if submit_to_api(submission):
            submissions_created += 1
    
    # Historical spread
    print("📅 Creating additional historical data...")
    
    for i in range(32):  # Fill to get ~117 total
        location = random.choice(LOCATIONS)
        shopper = random.choice(SHOPPERS)
        channel = random.choice(CHANNELS)
        performance = random.choice(["good", "average", "good", "average", "excellent"])
        
        # Spread across the full date range
        days_ago = random.randint(1, 180)
        visit_date = start_date + timedelta(days=days_ago,
                                          hours=random.randint(8, 22),
                                          minutes=random.randint(0, 59))
        
        submission = create_submission(location, shopper, channel, performance, visit_date)
        
        if submit_to_api(submission):
            submissions_created += 1
    
    print(f"\n🎉 Successfully created {submissions_created} submissions via API!")
    
    return submissions_created

if __name__ == "__main__":
    
    # Check if server is running
    try:
        response = requests.get(f"{API_BASE}/api", timeout=5)
        if response.status_code != 200:
            print("❌ Backend server is not responding properly")
            exit(1)
    except Exception as e:
        print(f"❌ Cannot connect to backend server: {e}")
        print("Make sure the server is running on http://127.0.0.1:8000")
        exit(1)
    
    # Create the data
    total_submissions = create_comprehensive_data()
    
    print(f"\n✅ API Population Complete!")
    print(f"📊 Total Submissions Created: {total_submissions}")
    print(f"🌐 Server: {API_BASE}")
    print(f"📍 Endpoint: {SUBMIT_ENDPOINT}")
    print(f"\nAdmin dashboard should now have access to all {total_submissions} submissions!")