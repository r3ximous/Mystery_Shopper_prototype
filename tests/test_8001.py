#!/usr/bin/env python3
"""
Test API on port 8001
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
            {"question_id": "FAC_002", "score": 3}
        ],
        "latency_samples": [
            {"question_id": "SVC_001", "ms": 1500.0},
            {"question_id": "SVC_002", "ms": 2100.0}
        ]
    }
    
    print("Testing API on port 8001...")
    print(json.dumps(payload, indent=2))
    print("\n" + "="*50 + "\n")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8001/api/survey/submit",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS! API submission worked!")
            result = response.json()
            print(json.dumps(result, indent=2))
            return True
        else:
            print("❌ FAILED!")
            try:
                error = response.json()
                print("Error details:")
                print(json.dumps(error, indent=2))
            except:
                print("Raw response:")
                print(response.text)
            return False
                
    except Exception as e:
        print(f"🚨 Connection Error: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    print(f"\n✨ Test completed! Result: {'SUCCESS' if success else 'FAILED'}")
