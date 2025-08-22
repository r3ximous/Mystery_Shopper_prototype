#!/usr/bin/env python3
"""
Simple synchronous test to debug API submission
"""
import requests
import json
from datetime import datetime

def test_api():
    payload = {
        "channel": "WEB",
        "location_code": "TEST-001",
        "shopper_id": "TESTER-001", 
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {"question_id": "SVC_001", "score": 4},
            {"question_id": "SVC_002", "score": 5},
            {"question_id": "FAC_002", "score": 3}  # Using FAC_002 (active) instead of FAC_001 (inactive)
        ],
        "latency_samples": [
            {"question_id": "SVC_001", "ms": 1500.0},
            {"question_id": "SVC_002", "ms": 2100.0}
        ]
    }
    
    print("Testing API with payload:")
    print(json.dumps(payload, indent=2))
    print("\n" + "="*50 + "\n")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/survey/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS! Submission worked!")
            result = response.json()
            print(json.dumps(result, indent=2))
        else:
            print("❌ FAILED!")
            try:
                error = response.json()
                print("Error details:")
                print(json.dumps(error, indent=2))
            except:
                print("Raw response:")
                print(response.text)
                
    except Exception as e:
        print(f"🚨 Connection Error: {e}")

if __name__ == "__main__":
    test_api()
    print("\n✨ Test completed!")
