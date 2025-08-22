#!/usr/bin/env python3
"""
Test correct API endpoint path
"""
import requests
import json
from datetime import datetime

def test_correct_endpoint():
    payload = {
        "channel": "WEB",
        "location_code": "TEST-001",
        "shopper_id": "TESTER-001", 
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {"question_id": "SVC_001", "score": 4},
            {"question_id": "SVC_002", "score": 5},
            {"question_id": "FAC_002", "score": 3}
        ],
        "latency_samples": [
            {"question_id": "SVC_001", "ms": 1500.0},
            {"question_id": "SVC_002", "ms": 2100.0}
        ]
    }
    
    print("Testing CORRECT endpoint: /survey/submit")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8001/survey/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            print(json.dumps(response.json(), indent=2))
        else:
            print("❌ FAILED!")
            print(response.text)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_correct_endpoint()
