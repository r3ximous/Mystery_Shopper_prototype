"""
Complete Dummy Database Generator
Creates a comprehensive test database for the admin dashboard
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sys
import os

# Add the parent directories to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

from app.backend.services.survey_service import save_submission, _DB, _COUNTER
from app.backend.schemas.survey import SurveySubmissionIn, QuestionScore, LatencySample

# Sample data
LOCATIONS = [
    "DXB_MAIN", "AUH_CENTRAL", "SHJ_CITY", "RAK_MALL", "FUJ_CENTER",
    "AJM_PLAZA", "UAQ_SQUARE", "DXB_MALL", "AUH_MARINA", "SHJ_MEGA"
]

GOVERNMENT_LOCATIONS = [
    "DXB_PASSPORT", "AUH_EMIRATES_ID", "SHJ_MUNICIPALITY", "RAK_COURT", 
    "FUJ_POLICE", "AJM_TRAFFIC", "UAQ_HEALTH", "DXB_RTA", "AUH_ADEK", "SHJ_SEWA"
]

BANK_LOCATIONS = [
    "ADCB_MAIN", "FAB_CENTRAL", "ENBD_MALL", "RAK_BRANCH", "AJMAN_BANK",
    "CBD_TOWER", "HSBC_DUBAI", "CITIBANK_AUH", "NBQ_SHJ", "MASHREQ_RAK"
]

SHOPPER_IDS = [
    "MS001", "MS002", "MS003", "MS004", "MS005", "MS006", "MS007", "MS008", "MS009", "MS010",
    "MS011", "MS012", "MS013", "MS014", "MS015", "MS016", "MS017", "MS018", "MS019", "MS020"
]

SPECIALIZED_SHOPPERS = [
    "MS_SENIOR_001", "MS_WHEELCHAIR_002", "MS_FAMILY_003", "MS_BUSINESS_004", "MS_TECH_005"
]

CHANNELS = ["CALL_CENTER", "ON_SITE", "WEB", "MOBILE_APP"]

# Question IDs from the actual CSV data
QUESTION_IDS = [
    "Q0", "Q1", "Q10", "Q11", "Q12", "Q12.0", "Q15", "Q16", "Q17", "Q18", "Q19", "Q21", "Q21.0", "Q21.1",
    "Q22", "Q23", "Q25", "Q25.1", "Q25.2", "Q26", "Q26.0", "Q27", "Q27.1", "Q27.2", "Q27.3", "Q28", "Q29",
    "Q3", "Q30", "Q32", "Q34", "Q37", "Q38", "Q39", "Q40", "Q42", "Q43", "Q44", "Q46", "Q51", "Q52", "Q53",
    "Q54", "Q55", "Q56", "Q59", "Q6", "Q60", "Q61", "Q65", "Q66", "Q67", "Q68", "Q69", "Q70", "Q71", "Q72",
    "Q73", "Q74", "Q77", "Q78", "Q79", "Q80", "Q81", "Q87", "Q9"
]

# Comments for different score ranges
POSITIVE_COMMENTS = [
    "Excellent service, very professional staff",
    "Clean and well-organized facility", 
    "Quick and efficient process",
    "Staff was helpful and courteous",
    "Modern facilities with good amenities",
    "Outstanding customer service experience",
    "Well-maintained and professional environment"
]

NEGATIVE_COMMENTS = [
    "Staff seemed overwhelmed and slow",
    "Facility needs maintenance and cleaning",
    "Confusing layout and poor signage", 
    "Long waiting times, overcrowded",
    "Staff was not very helpful",
    "Outdated facilities, poor experience",
    "Serious service quality issues"
]

NEUTRAL_COMMENTS = [
    "Average experience, room for improvement",
    "Acceptable service level",
    "Standard facilities, nothing exceptional",
    "Could be better with minor improvements"
]

def get_score_for_pattern(pattern: str) -> int:
    """Get a score based on the overall performance pattern"""
    if pattern == "excellent":
        return random.choice([5, 5, 5, 4, 5])
    elif pattern == "good":
        return random.choice([4, 4, 5, 3, 4])
    elif pattern == "average":
        return random.choice([3, 3, 4, 2, 3])
    elif pattern == "poor":
        return random.choice([2, 1, 2, 3, 1])
    else:  # inconsistent
        return random.choice([1, 2, 3, 4, 5])

def get_comment_for_score(score: int, context: str = "") -> str:
    """Get appropriate comment based on score"""
    if score >= 4:
        comment = random.choice(POSITIVE_COMMENTS + [""])
        if context:
            comment = f"{comment} ({context})".strip(" ()")
        return comment
    elif score <= 2:
        comment = random.choice(NEGATIVE_COMMENTS)
        if context:
            comment = f"{comment} - {context}"
        return comment
    else:
        return random.choice(NEUTRAL_COMMENTS + ["", ""])

def create_comprehensive_database():
    """Create a comprehensive test database"""
    print("🎯 Creating Comprehensive Mystery Shopper Test Database")
    print("=" * 60)
    
    # Clear existing data
    global _DB, _COUNTER
    _DB.clear()
    _COUNTER = 1
    
    total_created = 0
    
    # 1. Main Performance Distribution (80 submissions)
    print("📊 Creating main performance distribution...")
    distributions = [
        ("excellent", 15),
        ("good", 25), 
        ("average", 25),
        ("poor", 10),
        ("inconsistent", 5)
    ]
    
    for pattern, count in distributions:
        print(f"  Creating {count} '{pattern}' submissions...")
        
        for i in range(count):
            try:
                days_ago = random.randint(0, 30)
                location = random.choice(LOCATIONS)
                shopper = random.choice(SHOPPER_IDS)
                channel = random.choice(CHANNELS)
                
                visit_time = datetime.now() - timedelta(
                    days=days_ago,
                    hours=random.randint(8, 18),
                    minutes=random.randint(0, 59)
                )
                
                scores = []
                selected_questions = random.sample(QUESTION_IDS, k=random.randint(20, 35))
                
                for q_id in selected_questions:
                    score = get_score_for_pattern(pattern)
                    comment = get_comment_for_score(score) if random.random() < 0.25 else None
                    
                    scores.append(QuestionScore(
                        question_id=q_id,
                        score=score,
                        comment=comment
                    ))
                
                # Latency samples for mobile/web
                latency_samples = []
                if channel in ["MOBILE_APP", "WEB"] and random.random() < 0.4:
                    voice_questions = random.sample([s.question_id for s in scores], 
                                                  k=random.randint(3, min(10, len(scores))))
                    for q_id in voice_questions:
                        latency_ms = random.uniform(1000, 6000)
                        latency_samples.append(LatencySample(question_id=q_id, ms=latency_ms))
                
                submission_data = SurveySubmissionIn(
                    channel=channel,
                    location_code=location,
                    shopper_id=shopper,
                    visit_datetime=visit_time,
                    scores=scores,
                    latency_samples=latency_samples
                )
                
                save_submission(submission_data)
                total_created += 1
                
            except Exception as e:
                print(f"    ❌ Error creating {pattern} submission: {e}")
    
    # 2. Edge Case Scenarios (10 submissions)
    print("🎭 Creating edge case scenarios...")
    
    edge_scenarios = [
        {
            "name": "Perfect Score",
            "location": random.choice(BANK_LOCATIONS),
            "shopper": "MS_PREMIUM_001",
            "channel": "ON_SITE",
            "scores": [5] * 30,
            "comment": "Outstanding service quality, exceeded all expectations"
        },
        {
            "name": "Critical Issues",
            "location": random.choice(GOVERNMENT_LOCATIONS),
            "shopper": "MS_CRITICAL_002", 
            "channel": "CALL_CENTER",
            "scores": [1] * 25,
            "comment": "Serious service failures requiring immediate attention"
        },
        {
            "name": "Voice Power User",
            "location": "DXB_TECH_HUB",
            "shopper": "MS_VOICE_003",
            "channel": "MOBILE_APP", 
            "voice_heavy": True,
            "comment": "Extensive voice input usage - very convenient"
        },
        {
            "name": "Weekend Visitor",
            "location": random.choice(BANK_LOCATIONS),
            "shopper": "MS_WEEKEND_004",
            "channel": "WEB",
            "weekend": True
        },
        {
            "name": "Late Night Service",
            "location": "DXB_24H_SERVICE",
            "shopper": "MS_NIGHT_005",
            "channel": "ON_SITE",
            "late_night": True
        }
    ]
    
    for scenario in edge_scenarios:
        try:
            print(f"  Creating '{scenario['name']}' scenario...")
            
            if scenario.get('weekend'):
                # Weekend date
                visit_time = datetime.now() - timedelta(days=6)  # Last Saturday
                visit_time = visit_time.replace(hour=14, minute=30)
            elif scenario.get('late_night'):
                # Late night
                visit_time = datetime.now() - timedelta(days=2)
                visit_time = visit_time.replace(hour=23, minute=45)
            else:
                visit_time = datetime.now() - timedelta(
                    days=random.randint(1, 5),
                    hours=random.randint(9, 17),
                    minutes=random.randint(0, 59)
                )
            
            scores = []
            selected_questions = random.sample(QUESTION_IDS, k=random.randint(25, 40))
            
            for q_id in selected_questions:
                if 'scores' in scenario:
                    score = random.choice(scenario['scores'])
                else:
                    score = get_score_for_pattern("good")
                
                comment = scenario.get('comment') if random.random() < 0.3 else None
                
                scores.append(QuestionScore(
                    question_id=q_id,
                    score=score,
                    comment=comment
                ))
            
            # Heavy voice usage for voice scenario
            latency_samples = []
            if scenario.get('voice_heavy') or (scenario['channel'] in ["MOBILE_APP", "WEB"] and random.random() < 0.5):
                voice_count = len(scores) if scenario.get('voice_heavy') else random.randint(5, 15)
                voice_questions = random.sample([s.question_id for s in scores], k=min(voice_count, len(scores)))
                
                for q_id in voice_questions:
                    latency_ms = random.uniform(800, 4000) if scenario.get('voice_heavy') else random.uniform(2000, 8000)
                    latency_samples.append(LatencySample(question_id=q_id, ms=latency_ms))
            
            submission_data = SurveySubmissionIn(
                channel=scenario['channel'],
                location_code=scenario['location'],
                shopper_id=scenario['shopper'],
                visit_datetime=visit_time,
                scores=scores,
                latency_samples=latency_samples
            )
            
            save_submission(submission_data)
            total_created += 1
            
        except Exception as e:
            print(f"    ❌ Error creating {scenario['name']}: {e}")
    
    # 3. Historical Data (50 submissions over 6 months)
    print("📅 Creating historical data...")
    
    for month_ago in range(1, 7):
        submissions_this_month = max(2, 12 - month_ago * 2)
        
        for _ in range(submissions_this_month):
            try:
                # Random date within that month
                start_date = datetime.now() - timedelta(days=month_ago * 30)
                end_date = start_date + timedelta(days=30)
                random_date = start_date + timedelta(
                    seconds=random.randint(0, int((end_date - start_date).total_seconds()))
                )
                
                pattern = random.choice(["excellent", "good", "average", "poor", "inconsistent"])
                all_locations = LOCATIONS + GOVERNMENT_LOCATIONS + BANK_LOCATIONS
                all_shoppers = SHOPPER_IDS + SPECIALIZED_SHOPPERS
                
                scores = []
                selected_questions = random.sample(QUESTION_IDS, k=random.randint(15, 30))
                
                for q_id in selected_questions:
                    score = get_score_for_pattern(pattern)
                    comment = get_comment_for_score(score, f"Historical visit from {random_date.strftime('%B %Y')}") if random.random() < 0.15 else None
                    
                    scores.append(QuestionScore(
                        question_id=q_id,
                        score=score,
                        comment=comment
                    ))
                
                submission_data = SurveySubmissionIn(
                    channel=random.choice(CHANNELS),
                    location_code=random.choice(all_locations),
                    shopper_id=random.choice(all_shoppers),
                    visit_datetime=random_date,
                    scores=scores,
                    latency_samples=[]
                )
                
                save_submission(submission_data)
                total_created += 1
                
            except Exception as e:
                print(f"    ❌ Error creating historical data: {e}")
    
    return total_created

def print_comprehensive_summary():
    """Print comprehensive database summary"""
    if not _DB:
        print("📭 Database is empty")
        return
    
    print(f"\n📊 Comprehensive Database Summary:")
    print(f"Total Submissions: {len(_DB)}")
    
    # Channel distribution
    channel_counts = {}
    for sub in _DB:
        channel_counts[sub.channel] = channel_counts.get(sub.channel, 0) + 1
    
    print(f"\n📱 Channel Distribution:")
    for channel, count in sorted(channel_counts.items()):
        percentage = (count / len(_DB)) * 100
        print(f"  {channel:12}: {count:3} ({percentage:5.1f}%)")
    
    # Top locations
    location_counts = {}
    for sub in _DB:
        location_counts[sub.location_code] = location_counts.get(sub.location_code, 0) + 1
    
    print(f"\n🏢 Top 10 Locations:")
    sorted_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)
    for location, count in sorted_locations[:10]:
        print(f"  {location:15}: {count:3} submissions")
    
    # Shopper activity
    shopper_counts = {}
    for sub in _DB:
        shopper_counts[sub.shopper_id] = shopper_counts.get(sub.shopper_id, 0) + 1
    
    print(f"\n👥 Most Active Shoppers:")
    sorted_shoppers = sorted(shopper_counts.items(), key=lambda x: x[1], reverse=True)
    for shopper, count in sorted_shoppers[:5]:
        print(f"  {shopper:15}: {count:3} submissions")
    
    # Date range
    dates = [sub.visit_datetime for sub in _DB]
    print(f"\n📅 Date Range:")
    print(f"  From: {min(dates).strftime('%Y-%m-%d %H:%M')}")
    print(f"  To:   {max(dates).strftime('%Y-%m-%d %H:%M')}")
    print(f"  Span: {(max(dates) - min(dates)).days} days")
    
    # Score statistics
    all_scores = []
    voice_submissions = 0
    total_voice_latency = 0
    voice_samples_count = 0
    
    for sub in _DB:
        all_scores.extend([score.score for score in sub.scores])
        if sub.latency_samples:
            voice_submissions += 1
            for sample in sub.latency_samples:
                total_voice_latency += sample.ms
                voice_samples_count += 1
    
    if all_scores:
        avg_score = sum(all_scores) / len(all_scores)
        print(f"\n⭐ Score Statistics:")
        print(f"  Average Score: {avg_score:.2f}/5.0")
        print(f"  Total Answers: {len(all_scores)}")
        print(f"  Score Distribution:")
        for score in range(1, 6):
            count = all_scores.count(score)
            percentage = (count / len(all_scores)) * 100
            print(f"    {score} stars: {count:4} ({percentage:5.1f}%)")
    
    if voice_samples_count > 0:
        avg_latency = total_voice_latency / voice_samples_count
        print(f"\n🎤 Voice Usage Statistics:")
        print(f"  Submissions with Voice: {voice_submissions}")
        print(f"  Total Voice Samples: {voice_samples_count}")
        print(f"  Average Voice Latency: {avg_latency:.0f}ms")

def main():
    print("🚀 Mystery Shopper Comprehensive Database Generator")
    print("Creating realistic test data for admin dashboard...")
    
    total_created = create_comprehensive_database()
    
    print(f"\n🎉 Successfully created {total_created} total submissions!")
    print_comprehensive_summary()
    print(f"\n✅ Comprehensive dummy database is ready for admin dashboard!")
    
    # Quick test - try to access a few submissions
    print(f"\n🔍 Quick Data Verification:")
    if len(_DB) >= 3:
        for i in [0, len(_DB)//2, -1]:
            sub = _DB[i]
            print(f"  [{i+1 if i >= 0 else len(_DB)}] {sub.location_code} via {sub.channel} - {len(sub.scores)} answers")

if __name__ == "__main__":
    main()
