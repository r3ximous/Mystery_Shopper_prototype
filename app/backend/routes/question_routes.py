"""
API endpoints for question management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.backend.database import get_database
from app.backend.services.question_service import QuestionService, CategoryService

router = APIRouter(prefix="/questions", tags=["Questions"])

# Pydantic models for request/response
class QuestionCreate(BaseModel):
    code: str = Field(..., max_length=20, description="Unique question code")
    category_id: int = Field(..., description="Category ID")
    text_en: str = Field(..., max_length=500, description="English text")
    text_ar: str = Field(..., max_length=500, description="Arabic text")
    help_en: Optional[str] = Field(None, description="English help text")
    help_ar: Optional[str] = Field(None, description="Arabic help text")
    weight: float = Field(1.0, ge=0.1, le=5.0, description="Question weight")
    min_score: int = Field(1, ge=1, le=5)
    max_score: int = Field(5, ge=1, le=5)
    display_order: int = Field(0, ge=0)
    is_required: bool = Field(True)
    created_by: Optional[str] = None

class QuestionUpdate(BaseModel):
    text_en: Optional[str] = Field(None, max_length=500)
    text_ar: Optional[str] = Field(None, max_length=500)
    help_en: Optional[str] = None
    help_ar: Optional[str] = None
    weight: Optional[float] = Field(None, ge=0.1, le=5.0)
    display_order: Optional[int] = Field(None, ge=0)
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None

class CategoryCreate(BaseModel):
    code: str = Field(..., max_length=20, description="Unique category code")
    name_en: str = Field(..., max_length=100, description="English name")
    name_ar: str = Field(..., max_length=100, description="Arabic name")
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    weight: float = Field(1.0, ge=0.1, le=5.0, description="Category weight")

class CategoryUpdate(BaseModel):
    name_en: Optional[str] = Field(None, max_length=100)
    name_ar: Optional[str] = Field(None, max_length=100)
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    weight: Optional[float] = Field(None, ge=0.1, le=5.0)
    is_active: Optional[bool] = None

# Question endpoints
@router.get("/")
async def get_questions(
    language: str = Query("en", regex="^(en|ar)$", description="Language code"),
    category: Optional[str] = Query(None, description="Filter by category code"),
    active_only: bool = Query(True, description="Return only active questions"),
    db: Session = Depends(get_database)
):
    """Get all questions, optionally filtered by category and language"""
    service = QuestionService(db)
    
    if category:
        # Future: add category filtering
        pass
    
    questions = service.get_active_questions(language)
    return {
        "questions": questions,
        "language": language,
        "total": len(questions)
    }

@router.get("/by-category")
async def get_questions_by_category(
    language: str = Query("en", regex="^(en|ar)$", description="Language code"),
    db: Session = Depends(get_database)
):
    """Get questions organized by category"""
    service = QuestionService(db)
    categories = service.get_questions_by_category(language)
    
    return {
        "categories": categories,
        "language": language,
        "total_categories": len(categories),
        "total_questions": sum(len(cat['questions']) for cat in categories)
    }

@router.post("/")
async def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_database)
):
    """Create a new question"""
    service = QuestionService(db)
    
    try:
        new_question = service.create_question(question.dict())
        return {
            "message": "Question created successfully",
            "question_code": new_question.code,
            "question_id": new_question.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create question: {str(e)}")

@router.put("/{question_code}")
async def update_question(
    question_code: str,
    updates: QuestionUpdate,
    db: Session = Depends(get_database)
):
    """Update an existing question"""
    service = QuestionService(db)
    
    # Filter out None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    updated_question = service.update_question(question_code, update_data)
    if not updated_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "message": "Question updated successfully",
        "question_code": updated_question.code
    }

@router.delete("/{question_code}")
async def delete_question(
    question_code: str,
    db: Session = Depends(get_database)
):
    """Soft delete a question (set is_active = False)"""
    service = QuestionService(db)
    
    success = service.delete_question(question_code)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {"message": f"Question {question_code} deactivated successfully"}

# Category endpoints
@router.get("/categories")
async def get_categories(
    language: str = Query("en", regex="^(en|ar)$", description="Language code"),
    db: Session = Depends(get_database)
):
    """Get all question categories"""
    service = CategoryService(db)
    categories = service.get_all_categories(language)
    
    return {
        "categories": categories,
        "language": language,
        "total": len(categories)
    }

@router.post("/categories")
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_database)
):
    """Create a new question category"""
    service = CategoryService(db)
    
    try:
        new_category = service.create_category(category.dict())
        return {
            "message": "Category created successfully",
            "category_code": new_category.code,
            "category_id": new_category.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create category: {str(e)}")

@router.put("/categories/{category_code}")
async def update_category(
    category_code: str,
    updates: CategoryUpdate,
    db: Session = Depends(get_database)
):
    """Update an existing category"""
    service = CategoryService(db)
    
    # Filter out None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    updated_category = service.update_category(category_code, update_data)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {
        "message": "Category updated successfully",
        "category_code": updated_category.code
    }

# Scoring endpoint
@router.post("/calculate-score")
async def calculate_survey_score(
    survey_data: Dict[str, Any],
    db: Session = Depends(get_database)
):
    """Calculate weighted survey scores"""
    service = QuestionService(db)
    
    try:
        scores = service.calculate_survey_score(survey_data)
        return scores
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to calculate scores: {str(e)}")

# Bulk operations
@router.post("/bulk/reorder")
async def reorder_questions(
    question_orders: List[Dict[str, int]],  # [{"code": "SVC_001", "display_order": 1}]
    db: Session = Depends(get_database)
):
    """Bulk update question display orders"""
    service = QuestionService(db)
    
    try:
        updated_count = 0
        for item in question_orders:
            question_code = item.get('code')
            display_order = item.get('display_order')
            
            if question_code and display_order is not None:
                result = service.update_question(question_code, {'display_order': display_order})
                if result:
                    updated_count += 1
        
        return {
            "message": f"Updated display order for {updated_count} questions",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to reorder questions: {str(e)}")
