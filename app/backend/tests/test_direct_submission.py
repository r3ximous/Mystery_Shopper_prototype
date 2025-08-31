#!/usr/bin/env python3
"""
Direct API Test - Test the submission endpoints directly
"""

import sys
import os
from datetime import datetime

# Add the project root directory to path (go up 3 levels from tests/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
sys.path.insert(0, project_root)

from app.backend.schemas.survey import SurveySubmissionIn, QuestionScore, LatencySample
from app.backend.services.survey_service import save_submission, list_submissions, basic_metrics

def test_direct_submission():
    """Test direct submission using backend services"""
    print("🧪 Testing Direct Form Submission (Backend)")
    print("=" * 50)
    
    try:
        # Create test submission data
        test_submission = SurveySubmissionIn(
            channel="WEB",
            location_code="TEST_LOCATION_DIRECT",
            shopper_id="TEST_SHOPPER_DIRECT",
            visit_datetime=datetime.now(),
            scores=[
                QuestionScore(
                    question_id="Q1",
                    score=5,
                    comment="Excellent service quality"
                ),
                QuestionScore(
                    question_id="Q10",
                    score=4,
                    comment="Good overall experience"
                ),
                QuestionScore(
                    question_id="Q51",
                    score=1,  # "yes" - should trigger conditional questions
                    comment="Customer service was available"
                ),
                QuestionScore(
                    question_id="Q52",  # Conditional question
                    score=5,
                    comment="Staff was very presentable"
                ),
                QuestionScore(
                    question_id="Q53",  # Conditional question
                    score=1,
                    comment="Could identify employee name"
                )
            ],
            latency_samples=[
                LatencySample(question_id="Q1", ms=2500.0),
                LatencySample(question_id="Q10", ms=3200.0)
            ]
        )
        
        # Save the submission
        print("📝 Submitting test data...")
        result = save_submission(test_submission)
        
        print("✅ Form submission successful!")
        print(f"   Submission ID: {result.id}")
        print(f"   Location: {result.location_code}")
        print(f"   Shopper: {result.shopper_id}")
        print(f"   Channel: {result.channel}")
        print(f"   Created: {result.created_at}")
        print(f"   Total Questions: {len(result.scores)}")
        
        # Calculate and display the overall score
        from app.backend.services.survey_service import calculate_section_scores
        score_data = calculate_section_scores(result)
        print(f"   Overall Score: {score_data['overall_score']:.2f}/1.0")
        
        # Check if conditional questions are included
        question_ids = [score.question_id for score in result.scores]
        if 'Q51' in question_ids and 'Q52' in question_ids and 'Q53' in question_ids:
            print("✅ Conditional questions (Q52, Q53) properly included!")
        else:
            print("⚠️  Conditional questions not found")
            
        # Test voice latency data
        if result.latency_samples:
            print(f"✅ Voice latency data: {len(result.latency_samples)} samples")
            for sample in result.latency_samples:
                print(f"   {sample.question_id}: {sample.ms:.0f}ms")
        else:
            print("ℹ️  No voice latency data")
            
        return True
        
    except Exception as e:
        print(f"❌ Direct submission failed: {e}")
        return False

def test_database_state():
    """Test the current database state"""
    print(f"\n📊 Testing Database State:")
    
    try:
        # Get raw submissions
        submissions = list_submissions()
        print(f"✅ Total submissions in database: {len(submissions)}")
        
        if submissions:
            latest = submissions[-1]  # Most recent
            # Calculate score for the latest submission
            from app.backend.services.survey_service import calculate_section_scores
            score_data = calculate_section_scores(latest)
            
            print(f"   Latest submission:")
            print(f"     ID: {latest.id}")
            print(f"     Location: {latest.location_code}")
            print(f"     Shopper: {latest.shopper_id}")
            print(f"     Overall Score: {score_data['overall_score']:.2f}/1.0")
            print(f"     Date: {latest.visit_datetime}")
            
        # Test metrics
        metrics = basic_metrics()
        print(f"\n📈 Current Metrics:")
        print(f"   Total Submissions: {metrics['total_submissions']}")
        print(f"   Average Score: {metrics['average_score']:.2f}/1.0")
        print(f"   Active Channels: {metrics['active_channels']}")
        
        # Show channel breakdown
        if metrics['channel_breakdown']:
            print(f"   Channel Breakdown:")
            for channel, data in metrics['channel_breakdown'].items():
                print(f"     {channel}: {data['count']} submissions, {data['avg_score']:.2f} avg")
        
        return True
        
    except Exception as e:
        print(f"❌ Database state test failed: {e}")
        return False

def test_form_validation():
    """Test form validation directly"""
    print(f"\n🔍 Testing Form Validation (Direct):")
    
    validation_tests = [
        {
            "name": "Valid submission",
            "data": {
                "channel": "WEB",
                "location_code": "VALID_LOC",
                "shopper_id": "VALID_SHOPPER",
                "visit_datetime": datetime.now(),
                "scores": [
                    QuestionScore(question_id="Q1", score=5, comment="Great")
                ]
            },
            "should_pass": True
        },
        {
            "name": "Invalid score (too high)",
            "data": {
                "channel": "WEB", 
                "location_code": "VALID_LOC",
                "shopper_id": "VALID_SHOPPER",
                "visit_datetime": datetime.now(),
                "scores": []  # Empty scores to test later
            },
            "raw_score": 10,  # Will be tested separately
            "should_pass": False
        },
        {
            "name": "Invalid score (too low)",
            "data": {
                "channel": "WEB",
                "location_code": "VALID_LOC", 
                "shopper_id": "VALID_SHOPPER",
                "visit_datetime": datetime.now(),
                "scores": []  # Empty scores to test later
            },
            "raw_score": 0,  # Will be tested separately
            "should_pass": False
        }
    ]
    
    for test in validation_tests:
        print(f"   Testing: {test['name']}")
        try:
            # Handle special score validation tests
            if 'raw_score' in test:
                # Test invalid QuestionScore creation directly
                try:
                    invalid_score = QuestionScore(question_id="Q1", score=test['raw_score'], comment="Test")
                    print(f"      ⚠️  Expected QuestionScore validation failure but passed")
                except Exception as score_e:
                    print(f"      ✅ QuestionScore validation failed as expected: {str(score_e)[:50]}...")
                continue
            
            submission = SurveySubmissionIn(**test['data'])
            result = save_submission(submission)
            
            if test['should_pass']:
                print(f"      ✅ Validation passed as expected (ID: {result.id})")
            else:
                print(f"      ⚠️  Expected validation failure but passed (ID: {result.id})")
                
        except Exception as e:
            if not test['should_pass']:
                print(f"      ✅ Validation failed as expected: {str(e)[:50]}...")
            else:
                print(f"      ❌ Unexpected validation failure: {e}")

def main():
    """Run all direct tests"""
    print("🚀 Mystery Shopper Direct API Test Suite")
    print("=" * 60)
    
    success1 = test_direct_submission()
    success2 = test_database_state()
    test_form_validation()
    
    print(f"\n📊 Test Results Summary:")
    print(f"✅ Direct submission: {'PASSED' if success1 else 'FAILED'}")
    print(f"✅ Database state: {'PASSED' if success2 else 'FAILED'}")
    print(f"✅ Form validation: TESTED")
    
    if success1 and success2:
        print(f"\n🎉 Backend form submission functionality is working!")
        print(f"💡 You can now test the web form at: http://127.0.0.1:8001")
        print(f"💡 Check the admin dashboard at: http://127.0.0.1:8001/admin")
    else:
        print(f"\n🔧 Some tests failed - check the errors above")

if __name__ == "__main__":
    main()