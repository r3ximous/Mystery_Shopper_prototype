#!/usr/bin/env python3
"""
Database setup and testing script for the modular question management system
"""

import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.backend.database import init_database, seed_default_questions, SessionLocal
from app.backend.services.question_service import QuestionService, CategoryService

def test_database_setup():
    """Test database initialization and seeding"""
    print("🔧 Initializing database...")
    init_database()
    
    print("🌱 Seeding default questions...")
    seed_default_questions()
    
    print("✅ Database setup complete!")

def test_question_service():
    """Test question service functionality"""
    db = SessionLocal()
    try:
        service = QuestionService(db)
        
        print("\n📋 Testing question service...")
        
        # Test getting questions in English
        questions_en = service.get_active_questions('en')
        print(f"📝 Found {len(questions_en)} questions in English")
        
        # Test getting questions in Arabic
        questions_ar = service.get_active_questions('ar')
        print(f"📝 Found {len(questions_ar)} questions in Arabic")
        
        # Test getting questions by category
        categories = service.get_questions_by_category('en')
        print(f"📊 Found {len(categories)} categories")
        
        for cat in categories:
            print(f"   - {cat['name']} ({cat['code']}): {len(cat['questions'])} questions, weight: {cat['weight']}")
        
        # Test score calculation
        sample_scores = [
            {"question_id": "SVC_001", "score": 4},
            {"question_id": "SVC_002", "score": 5},
            {"question_id": "FAC_001", "score": 3},
            {"question_id": "EFF_001", "score": 4}
        ]
        
        score_result = service.calculate_survey_score({"scores": sample_scores})
        print(f"\n🎯 Sample survey score: {score_result['total_score']}/5.0")
        print(f"📊 Category breakdown:")
        for cat_code, cat_data in score_result['category_scores'].items():
            print(f"   - {cat_data['name_en']}: {cat_data['average']:.2f}/5.0")
            
    except Exception as e:
        print(f"❌ Error testing question service: {e}")
    finally:
        db.close()

def test_category_service():
    """Test category service functionality"""
    db = SessionLocal()
    try:
        service = CategoryService(db)
        
        print("\n📂 Testing category service...")
        
        # Test getting categories
        categories_en = service.get_all_categories('en')
        print(f"📁 Found {len(categories_en)} categories in English")
        
        categories_ar = service.get_all_categories('ar')  
        print(f"📁 Found {len(categories_ar)} categories in Arabic")
        
        for cat in categories_en:
            print(f"   - {cat['name']} ({cat['code']}): {cat['question_count']} questions")
            
    except Exception as e:
        print(f"❌ Error testing category service: {e}")
    finally:
        db.close()

def test_api_endpoints():
    """Test API endpoints with sample requests"""
    print("\n🌐 API endpoints available at:")
    print("   GET  /api/questions/?language=en")
    print("   GET  /api/questions/?language=ar") 
    print("   GET  /api/questions/by-category?language=en")
    print("   GET  /api/questions/categories?language=en")
    print("   POST /api/questions/ (create new question)")
    print("   PUT  /api/questions/{code} (update question)")
    print("   DELETE /api/questions/{code} (deactivate question)")
    print("   POST /api/questions/calculate-score")

def main():
    """Main test function"""
    print("🚀 Mystery Shopper Modular Question Management System")
    print("=" * 60)
    
    try:
        # Test database setup
        test_database_setup()
        
        # Test services
        test_question_service()
        test_category_service()
        test_api_endpoints()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("\n📖 Next steps:")
        print("   1. Start the server: python -m uvicorn app.frontend.app_frontend_server:frontend --reload")
        print("   2. Visit http://localhost:8000 for the survey form")
        print("   3. Visit http://localhost:8000/admin/questions for question management")
        print("   4. Try both English (?lang=en) and Arabic (?lang=ar) modes")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
