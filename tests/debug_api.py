#!/usr/bin/env python3
"""
Test script to debug survey submission API directly
"""
import httpx
import asyncio
import json
from datetime import datetime

async def test_api_submission():
    """Test survey submission to debug 422 errors"""
    
    # Test payload with new question format
    payload = {
        "channel": "WEB",
        "location_code": "TEST-001", 
        "shopper_id": "TESTER-001",
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {"question_id": "SVC_001", "score": 4},
            {"question_id": "SVC_002", "score": 5},
            {"question_id": "FAC_001", "score": 3}
        ],
        "latency_samples": [
            {"question_id": "SVC_001", "ms": 1500.0},
            {"question_id": "SVC_002", "ms": 2100.0}
        ]
    }
    
    print("🧪 Testing API submission...")
    print("Payload:", json.dumps(payload, indent=2))
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://127.0.0.1:8000/api/survey/submit", 
                json=payload
            )
            
            print(f"\n📊 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Success!")
                print("Response:", json.dumps(response.json(), indent=2))
            else:
                print("❌ Failed!")
                try:
                    error_details = response.json()
                    print("Error Details:", json.dumps(error_details, indent=2))
                except:
                    print("Raw Response:", response.text)
                    
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_submission())
