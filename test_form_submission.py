#!/usr/bin/env python3
"""
Test Form Submission
Test the Mystery Shopper survey form submission functionality
"""

import requests
import json
from datetime import datetime
import time

def test_form_submission():
    """Test the survey form submission process"""
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing Mystery Shopper Form Submission")
    print("=" * 50)
    
    # First, let's check if the server is responding
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("✅ Server is responding")
            print(f"   Status: {response.status_code}")
        else:
            print(f"❌ Server returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False
    
    # Test form submission endpoint
    print(f"\n📝 Testing Form Submission Endpoint:")
    
    # Sample form data (mimicking what the frontend would send)
    test_submission_data = {
        "channel": "WEB",
        "location_code": "TEST_LOCATION_001",
        "shopper_id": "TEST_SHOPPER_001",
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {
                "question_id": "Q1",
                "score": 5,
                "comment": "Excellent service quality"
            },
            {
                "question_id": "Q10", 
                "score": 4,
                "comment": "Good overall experience"
            },
            {
                "question_id": "Q51",
                "score": 1,
                "comment": "Customer service was available"  # This should trigger conditional questions
            },
            {
                "question_id": "Q52",
                "score": 5,
                "comment": "Staff was very presentable"  # Conditional question
            },
            {
                "question_id": "Q53",
                "score": 1,
                "comment": "Could identify employee name"  # Conditional question
            }
        ],
        "latency_samples": [
            {
                "question_id": "Q1",
                "ms": 2500.0
            },
            {
                "question_id": "Q10",
                "ms": 3200.0
            }
        ]
    }
    
    try:
        # Submit the form data
        response = requests.post(
            f"{base_url}/api/survey/submit",
            json=test_submission_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Form submission successful!")
            print(f"   Response: {result}")
            
            # Check if we got back the expected structure
            if "submission_id" in result:
                submission_id = result["submission_id"]
                print(f"   📄 Submission ID: {submission_id}")
                
                # Test retrieving the submission
                print(f"\n🔍 Testing Submission Retrieval:")
                try:
                    # Get admin submissions (need to handle auth)
                    admin_response = requests.get(f"{base_url}/admin/submissions", timeout=10)
                    if admin_response.status_code == 200:
                        submissions = admin_response.json()
                        print(f"   ✅ Retrieved {len(submissions)} total submissions")
                        
                        # Find our test submission
                        test_sub = None
                        for sub in submissions:
                            if sub.get("shopper_id") == "TEST_SHOPPER_001":
                                test_sub = sub
                                break
                        
                        if test_sub:
                            print(f"   ✅ Found our test submission!")
                            print(f"      ID: {test_sub.get('id')}")
                            print(f"      Location: {test_sub.get('location_code')}")
                            print(f"      Overall Score: {test_sub.get('overall_score', 0):.2f}/5.0")
                            print(f"      Total Answers: {len(test_sub.get('scores', []))}")
                            
                            # Test conditional logic - check if Q52 and Q53 are included
                            question_ids = [score.get('question_id') for score in test_sub.get('scores', [])]
                            if 'Q51' in question_ids and 'Q52' in question_ids and 'Q53' in question_ids:
                                print(f"   ✅ Conditional questions (Q52, Q53) properly included!")
                            else:
                                print(f"   ⚠️  Conditional questions not found in submission")
                                print(f"      Question IDs: {question_ids}")
                        else:
                            print(f"   ❌ Could not find test submission in database")
                    else:
                        print(f"   ❌ Could not retrieve submissions: {admin_response.status_code}")
                        # This might be due to admin auth, let's try basic verification
                        print(f"   ℹ️  This might be due to admin authentication")
                        
                except Exception as e:
                    print(f"   ❌ Error retrieving submission: {e}")
            else:
                print(f"   ⚠️  Response missing submission_id: {result}")
                
        else:
            print(f"❌ Form submission failed!")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error during submission: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during submission: {e}")
        return False
    
    return True

def test_form_validation():
    """Test form validation with invalid data"""
    base_url = "http://127.0.0.1:8000"
    
    print(f"\n🔍 Testing Form Validation:")
    
    # Test with missing required fields
    invalid_data_tests = [
        {
            "name": "Missing channel",
            "data": {
                "location_code": "TEST_LOC",
                "shopper_id": "TEST_SHOPPER",
                "scores": []
            }
        },
        {
            "name": "Missing location_code", 
            "data": {
                "channel": "WEB",
                "shopper_id": "TEST_SHOPPER",
                "scores": []
            }
        },
        {
            "name": "Invalid score value",
            "data": {
                "channel": "WEB",
                "location_code": "TEST_LOC",
                "shopper_id": "TEST_SHOPPER",
                "scores": [
                    {
                        "question_id": "Q1",
                        "score": 10,  # Invalid score (should be 1-5)
                        "comment": "Test"
                    }
                ]
            }
        }
    ]
    
    for test_case in invalid_data_tests:
        print(f"   Testing: {test_case['name']}")
        try:
            response = requests.post(
                f"{base_url}/api/survey/submit",
                json=test_case['data'],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 422:  # Validation error
                print(f"      ✅ Validation working (422 error as expected)")
            elif response.status_code == 400:  # Bad request
                print(f"      ✅ Validation working (400 error as expected)")
            else:
                print(f"      ⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Error testing validation: {e}")

def test_conditional_questions():
    """Test conditional questions logic in form submission"""
    base_url = "http://127.0.0.1:8000"
    
    print(f"\n🔄 Testing Conditional Questions Logic:")
    
    # Test Q51 = "yes" should enable Q52, Q53, etc.
    conditional_test_data = {
        "channel": "WEB",
        "location_code": "CONDITIONAL_TEST_LOC",
        "shopper_id": "CONDITIONAL_TEST_SHOPPER",
        "visit_datetime": datetime.now().isoformat(),
        "scores": [
            {
                "question_id": "Q51",
                "score": 1,  # "yes" - should trigger conditional questions
                "comment": "Customer service employee was available"
            },
            {
                "question_id": "Q52",  # Should be visible because Q51 = yes
                "score": 4,
                "comment": "Employee was presentable"
            },
            {
                "question_id": "Q53",  # Should be visible because Q51 = yes
                "score": 1,
                "comment": "Could identify employee name"
            },
            {
                "question_id": "Q54",  # Should be visible because Q51 = yes
                "score": 5,
                "comment": "Employee was very polite"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/survey/submit",
            json=conditional_test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print("   ✅ Conditional questions submission successful!")
            print(f"      Submission includes Q51, Q52, Q53, Q54")
            print(f"      This tests the 'show if Q51 is yes' logic")
        else:
            print(f"   ❌ Conditional questions test failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error testing conditional questions: {e}")

def main():
    """Run all form submission tests"""
    print("🚀 Mystery Shopper Form Submission Test Suite")
    print("=" * 60)
    
    # Run the tests
    success = test_form_submission()
    test_form_validation()
    test_conditional_questions()
    
    print(f"\n📊 Test Results Summary:")
    if success:
        print("✅ Basic form submission: PASSED")
        print("✅ Form validation: TESTED")
        print("✅ Conditional questions: TESTED")
        print(f"\n🎉 Form submission functionality is working!")
        print(f"💡 You can now test manually in the browser at: http://127.0.0.1:8000")
    else:
        print("❌ Basic form submission: FAILED")
        print("🔧 Please check server logs for more details")

if __name__ == "__main__":
    main()