"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.backend.models.question_models import Base
import os

# Database URL - use SQLite for development, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mystery_shopper.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_database():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def seed_default_questions():
    """Seed database with default questions"""
    from app.backend.models.question_models import QuestionCategory, Question
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(QuestionCategory).count() > 0:
            return
            
        # Create categories
        service_category = QuestionCategory(
            code="SERVICE",
            name_en="Service Quality",
            name_ar="جودة الخدمة",
            description_en="Overall service experience and staff interaction",
            description_ar="تجربة الخدمة الشاملة والتفاعل مع الموظفين",
            weight=1.5  # Higher weight for service
        )
        
        facility_category = QuestionCategory(
            code="FACILITY",
            name_en="Facility & Environment",
            name_ar="المرافق والبيئة",
            description_en="Physical space, cleanliness, and accessibility",
            description_ar="المساحة الفيزيائية والنظافة وإمكانية الوصول",
            weight=1.0
        )
        
        efficiency_category = QuestionCategory(
            code="EFFICIENCY",
            name_en="Process Efficiency",
            name_ar="كفاءة العملية",
            description_en="Speed, accuracy, and ease of service delivery",
            description_ar="السرعة والدقة وسهولة تقديم الخدمة",
            weight=1.2
        )
        
        db.add_all([service_category, facility_category, efficiency_category])
        db.flush()  # Get IDs
        
        # Create default questions
        questions = [
            # Service Quality
            Question(
                code="SVC_001",
                category_id=service_category.id,
                text_en="Staff friendliness and professionalism",
                text_ar="ود الموظفين ومهنيتهم",
                help_en="Rate the courtesy and professional manner of staff",
                help_ar="قيم مجاملة وطريقة التعامل المهني للموظفين",
                weight=1.2,
                display_order=1
            ),
            Question(
                code="SVC_002", 
                category_id=service_category.id,
                text_en="Knowledge and helpfulness of staff",
                text_ar="معرفة الموظفين ومدى مساعدتهم",
                help_en="How well staff understood your needs and provided assistance",
                help_ar="مدى فهم الموظفين لاحتياجاتك وتقديم المساعدة",
                weight=1.3,
                display_order=2
            ),
            Question(
                code="SVC_003",
                category_id=service_category.id, 
                text_en="Communication clarity and language support",
                text_ar="وضوح التواصل ودعم اللغة",
                help_en="Effectiveness of communication in your preferred language",
                help_ar="فعالية التواصل بلغتك المفضلة",
                weight=1.1,
                display_order=3
            ),
            
            # Facility & Environment  
            Question(
                code="FAC_001",
                category_id=facility_category.id,
                text_en="Cleanliness and maintenance of facility",
                text_ar="نظافة وصيانة المرفق",
                help_en="Overall cleanliness and upkeep of the service location",
                help_ar="النظافة العامة وصيانة موقع الخدمة",
                weight=1.0,
                display_order=4
            ),
            Question(
                code="FAC_002",
                category_id=facility_category.id,
                text_en="Accessibility and navigation",
                text_ar="إمكانية الوصول والتنقل",
                help_en="Ease of finding location and moving around the facility",
                help_ar="سهولة العثور على الموقع والتنقل في المرفق",
                weight=0.9,
                display_order=5
            ),
            
            # Process Efficiency
            Question(
                code="EFF_001",
                category_id=efficiency_category.id,
                text_en="Waiting time and queue management",
                text_ar="وقت الانتظار وإدارة الطوابير",
                help_en="Reasonable waiting time and organized queue system",
                help_ar="وقت انتظار معقول ونظام طوابير منظم",
                weight=1.4,
                display_order=6
            ),
            Question(
                code="EFF_002",
                category_id=efficiency_category.id,
                text_en="Service completion speed and accuracy",
                text_ar="سرعة ودقة إنجاز الخدمة",
                help_en="How quickly and accurately your service was completed",
                help_ar="مدى سرعة ودقة إنجاز خدمتك",
                weight=1.3,
                display_order=7
            )
        ]
        
        db.add_all(questions)
        db.commit()
        print("✅ Default questions seeded successfully")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding questions: {e}")
    finally:
        db.close()
