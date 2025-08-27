import requests
import json
from datetime import datetime, timedelta
import random

# Create multiple test submissions with different scores to demonstrate the dashboard
def create_test_submissions():
    base_url = "http://127.0.0.1:8000/api/survey/submit"
    
    # Sample questions for testing
    sample_questions = {
        'appearance': ['Q0', 'Q1', 'Q3', 'Q6', 'Q9', 'Q10', 'Q11', 'Q22'],
        'service_accessibility': ['Q28', 'Q27.1', 'Q27.2'],
        'professionalism': ['Q34', 'Q37', 'Q51'],
        'speed': ['Q66', 'Q66.1'],
        'ease_of_use': ['Q67', 'Q68', 'Q69'],
        'info_quality': ['Q74', 'Q75.0', 'Q77'],
        'privacy': ['Q81', 'Q81.0']
    }
    
    test_scenarios = [
        {
            "name": "Excellent Service",
            "location": "LOC001",
            "shopper": "SHOPPER_A",
            "channel": "ON_SITE",
            "score_multiplier": 1.0,  # Full scores
            "days_ago": 0
        },
        {
            "name": "Good Service",  
            "location": "LOC002",
            "shopper": "SHOPPER_B", 
            "channel": "WEB",
            "score_multiplier": 0.8,  # 80% of max scores
            "days_ago": 1
        },
        {
            "name": "Average Service",
            "location": "LOC003", 
            "shopper": "SHOPPER_C",
            "channel": "MOBILE_APP",
            "score_multiplier": 0.6,  # 60% of max scores  
            "days_ago": 2
        },
        {
            "name": "Poor Service",
            "location": "LOC004",
            "shopper": "SHOPPER_D", 
            "channel": "CALL_CENTER",
            "score_multiplier": 0.3,  # 30% of max scores
            "days_ago": 3
        },
        {
            "name": "Mixed Service",
            "location": "LOC005",
            "shopper": "SHOPPER_E", 
            "channel": "ON_SITE", 
            "score_multiplier": 0.75,  # 75% of max scores
            "days_ago": 4
        }
    ]
    
    question_max_scores = {
        'Q0': 1, 'Q1': 1, 'Q3': 1, 'Q6': 1, 'Q9': 1, 'Q10': 1, 'Q11': 1, 'Q22': 1,
        'Q28': 1, 'Q27.1': 1, 'Q27.2': 1,
        'Q34': 1, 'Q37': 1, 'Q51': 1,
        'Q66': 2, 'Q66.1': 2,  # Speed questions often have max score of 2
        'Q67': 1, 'Q68': 1, 'Q69': 1,
        'Q74': 1, 'Q75.0': 1, 'Q77': 2,  # Q77 often has max score of 2
        'Q81': 1, 'Q81.0': 1
    }
    
    for scenario in test_scenarios:
        visit_time = datetime.now() - timedelta(days=scenario["days_ago"])
        
        # Generate scores based on the multiplier
        scores = []
        all_questions = []
        for section_questions in sample_questions.values():
            all_questions.extend(section_questions)
        
        for question_id in all_questions:
            max_score = question_max_scores.get(question_id, 1)
            # Apply some randomness around the multiplier, but ensure minimum score of 1
            actual_multiplier = max(0.3, min(1, scenario["score_multiplier"] + random.uniform(-0.1, 0.1)))
            score = max(1, min(max_score, round(max_score * actual_multiplier)))
            scores.append({"question_id": question_id, "score": score})
        
        test_submission = {
            "location_code": scenario["location"],
            "shopper_id": scenario["shopper"], 
            "visit_datetime": visit_time.isoformat(),
            "channel": scenario["channel"],
            "scores": scores
        }
        
        # Submit the test data
        response = requests.post(base_url, json=test_submission)
        print(f"✓ {scenario['name']} ({scenario['channel']}): {response.status_code}")
        if response.status_code != 200:
            print(f"  Error: {response.json()}")

    # Get final metrics
    metrics_url = "http://127.0.0.1:8000/api/admin/metrics"
    headers = {'X-API-Key': 'dev-admin-key'}
    metrics_response = requests.get(metrics_url, headers=headers)
    
    if metrics_response.status_code == 200:
        metrics = metrics_response.json()
        print(f"\n📊 Dashboard Summary:")
        print(f"Total Submissions: {metrics['total']}")
        print(f"Overall Average Score: {metrics['avg_score']:.1%}")
        print(f"Channels: {list(metrics['channel_breakdown'].keys())}")
        
        print(f"\n🎯 Section Performance:")
        for section, score in metrics['section_breakdown'].items():
            weight = metrics['section_weights'][section]
            print(f"  {section}: {score:.1%} (Weight: {weight:.1%})")
    else:
        print(f"Error getting metrics: {metrics_response.status_code}")

if __name__ == "__main__":
    create_test_submissions()
