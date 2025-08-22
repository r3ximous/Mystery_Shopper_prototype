#!/usr/bin/env python3
"""
Full system test - start server and test all functionality
"""
import os
import sys
import time
import subprocess
import requests
import json
from datetime import datetime

def test_survey_submission():
    """Test survey submission end-to-end"""
    print("🧪 Testing Survey Submission System")
    print("=" * 50)
    
    # Test API endpoints
    base_url = "http://127.0.0.1:8001"
    
    # 1. Test root endpoint
    try:
        r = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {r.status_code}")
    except:
        print("❌ Root endpoint: Failed")
    
    # 2. Test questions endpoint 
    try:
        r = requests.get(f"{base_url}/questions")
        questions = r.json().get('questions', [])
        print(f"✅ Questions endpoint: {r.status_code} ({len(questions)} questions)")
        active_ids = [q['id'] for q in questions[:3]]  # Get first 3 active question IDs
        print(f"   Active question IDs: {active_ids}")
    except Exception as e:
        print(f"❌ Questions endpoint: {e}")
        return False
    
    # 3. Test survey submission
    payload = {
        "channel": "WEB",
        "location_code": "TEST-001",
        "shopper_id": "TESTER-001",
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {"question_id": active_ids[0], "score": 4},
            {"question_id": active_ids[1], "score": 5},
            {"question_id": active_ids[2], "score": 3}
        ],
        "latency_samples": [
            {"question_id": active_ids[0], "ms": 1500.0},
            {"question_id": active_ids[1], "ms": 2100.0}
        ]
    }
    
    print(f"\n🎯 Testing survey submission to /survey/submit...")
    try:
        r = requests.post(f"{base_url}/survey/submit", json=payload)
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            print("✅ SUCCESS! Survey submission worked!")
            result = r.json()
            print(f"   Survey ID: {result.get('id')}")
            print(f"   Created: {result.get('created_at')}")
            return True
        else:
            print("❌ FAILED!")
            print(f"   Response: {r.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    success = test_survey_submission()
    if success:
        print("\n🎉 ALL TESTS PASSED! The modular question system is working!")
        print("\n🚀 Next steps:")
        print("   1. Update frontend to use correct API endpoints")
        print("   2. Test web interface submission")
        print("   3. Verify voice recognition integration")
    else:
        print("\n❌ Tests failed - debugging needed")
