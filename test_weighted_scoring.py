import requests
import json
from datetime import datetime

# Test data for the updated scoring system
test_submission = {
    "location_code": "TEST001",
    "shopper_id": "SHOPPER001", 
    "visit_datetime": datetime.now().isoformat(),
    "channel": "ON_SITE",
    "scores": [
        # Appearance section questions (should get 0.05 total weight)
        {"question_id": "Q0", "score": 1},   # Center Access
        {"question_id": "Q1", "score": 1},   # Center Access
        {"question_id": "Q3", "score": 1},   # Facilities Parking
        {"question_id": "Q6", "score": 1},   # Premises Exterior
        {"question_id": "Q9", "score": 1},   # Premises Interior
        {"question_id": "Q10", "score": 1},  # Premises Interior
        {"question_id": "Q11", "score": 1},  # Premises Interior
        {"question_id": "Q22", "score": 1},  # Waiting Area
        
        # Service Accessibility (should get 0.15 weight)
        {"question_id": "Q28", "score": 1},   # Service Accessibility
        {"question_id": "Q27.1", "score": 1}, # People of Determination
        {"question_id": "Q27.2", "score": 1}, # People of Determination
        
        # Professionalism of Staff (should get 0.20 weight)
        {"question_id": "Q34", "score": 1},   # Receptionist questions
        {"question_id": "Q37", "score": 1},   # Receptionist questions
        {"question_id": "Q51", "score": 1},   # Customer service employee
        
        # Speed of Service (should get 0.20 weight)
        {"question_id": "Q66", "score": 2},   # Speed of Service - max score typically 2
        {"question_id": "Q66.1", "score": 2}, # Speed of Service - max score typically 2
        
        # Ease of use (should get 0.20 weight)
        {"question_id": "Q67", "score": 1},   # Ease of use
        {"question_id": "Q68", "score": 1},   # Ease of use
        {"question_id": "Q69", "score": 1},   # Ease of use
        
        # Service Information Quality (should get 0.15 weight)
        {"question_id": "Q74", "score": 1},   # Service Information Quality
        {"question_id": "Q75.0", "score": 1}, # Service Information Quality (Q75 is deleted, use Q75.0)
        {"question_id": "Q77", "score": 2},   # Service Information Quality
        
        # Customer privacy (should get 0.05 weight)
        {"question_id": "Q81", "score": 1},   # Customer privacy
        {"question_id": "Q81.0", "score": 1}, # Customer privacy
    ]
}

# Submit the test data
url = "http://127.0.0.1:8000/api/survey/submit"
response = requests.post(url, json=test_submission)

print(f"Submission Response: {response.status_code}")
print(f"Response: {response.json()}")

# Check metrics after submission
metrics_url = "http://127.0.0.1:8000/api/admin/metrics"
headers = {'X-API-Key': 'dev-admin-key'}
metrics_response = requests.get(metrics_url, headers=headers)

print(f"\nMetrics Response: {metrics_response.status_code}")
print(f"Metrics: {json.dumps(metrics_response.json(), indent=2)}")
