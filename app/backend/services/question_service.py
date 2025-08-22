"""
Question management service layer
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.backend.models.question_models import Question, QuestionCategory, Survey, SurveyResponse
import json

class QuestionService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_active_questions(self, language: str = 'en') -> List[Dict[str, Any]]:
        """Get all active questions ordered by display_order"""
        questions = (
            self.db.query(Question)
            .join(QuestionCategory)
            .filter(
                and_(
                    Question.is_active == True,
                    QuestionCategory.is_active == True
                )
            )
            .order_by(Question.display_order, Question.id)
            .all()
        )
        
        return [self._format_question(q, language) for q in questions]
    
    def get_questions_by_category(self, language: str = 'en') -> Dict[str, Any]:
        """Get questions organized by category"""
        categories = (
            self.db.query(QuestionCategory)
            .filter(QuestionCategory.is_active == True)
            .order_by(QuestionCategory.weight.desc())
            .all()
        )
        
        result = []
        for category in categories:
            questions = [
                self._format_question(q, language) 
                for q in category.questions 
                if q.is_active
            ]
            
            if questions:  # Only include categories with active questions
                result.append({
                    'id': category.id,
                    'code': category.code,
                    'name': category.name_ar if language == 'ar' else category.name_en,
                    'description': category.description_ar if language == 'ar' else category.description_en,
                    'weight': category.weight,
                    'questions': sorted(questions, key=lambda x: x['display_order'])
                })
        
        return result
    
    def _format_question(self, question: Question, language: str) -> Dict[str, Any]:
        """Format question for API response"""
        return {
            'id': question.code,  # Keep using code as frontend ID
            'code': question.code,
            'text_en': question.text_en,
            'text_ar': question.text_ar,
            'text': question.text_ar if language == 'ar' else question.text_en,
            'help': question.help_ar if language == 'ar' else question.help_en,
            'weight': question.weight,
            'min_score': question.min_score,
            'max_score': question.max_score,
            'display_order': question.display_order,
            'category_code': question.category.code if question.category else None,
            'is_required': question.is_required
        }
    
    def create_question(self, question_data: Dict[str, Any]) -> Question:
        """Create new question"""
        question = Question(**question_data)
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question
    
    def update_question(self, question_code: str, updates: Dict[str, Any]) -> Optional[Question]:
        """Update existing question"""
        question = self.db.query(Question).filter(Question.code == question_code).first()
        if not question:
            return None
            
        for key, value in updates.items():
            if hasattr(question, key):
                setattr(question, key, value)
        
        self.db.commit()
        self.db.refresh(question)
        return question
    
    def delete_question(self, question_code: str) -> bool:
        """Soft delete question (set is_active = False)"""
        question = self.db.query(Question).filter(Question.code == question_code).first()
        if not question:
            return False
            
        question.is_active = False
        self.db.commit()
        return True
    
    def calculate_survey_score(self, survey_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate weighted survey scores"""
        scores = survey_data.get('scores', [])
        if not scores:
            return {'total_score': 0, 'category_scores': {}}
        
        # Get question details with weights
        question_codes = [s.get('question_id') for s in scores]
        questions = (
            self.db.query(Question)
            .join(QuestionCategory)
            .filter(Question.code.in_(question_codes))
            .all()
        )
        
        question_lookup = {q.code: q for q in questions}
        category_scores = {}
        total_weighted_score = 0
        total_weight = 0
        
        for score_data in scores:
            question_code = score_data.get('question_id')
            score_value = score_data.get('score', 0)
            
            question = question_lookup.get(question_code)
            if not question:
                continue
                
            category_code = question.category.code
            question_weight = question.weight
            category_weight = question.category.weight
            
            # Calculate weighted score for this question
            weighted_score = score_value * question_weight * category_weight
            total_weighted_score += weighted_score
            total_weight += question_weight * category_weight
            
            # Track category-level scores
            if category_code not in category_scores:
                category_scores[category_code] = {
                    'total': 0,
                    'weight': 0,
                    'count': 0,
                    'name_en': question.category.name_en,
                    'name_ar': question.category.name_ar
                }
            
            category_scores[category_code]['total'] += weighted_score
            category_scores[category_code]['weight'] += question_weight * category_weight
            category_scores[category_code]['count'] += 1
        
        # Calculate final scores
        final_total_score = (total_weighted_score / total_weight) if total_weight > 0 else 0
        
        # Calculate category averages
        for category_code in category_scores:
            cat_data = category_scores[category_code]
            cat_data['average'] = (cat_data['total'] / cat_data['weight']) if cat_data['weight'] > 0 else 0
        
        return {
            'total_score': round(final_total_score, 2),
            'category_scores': category_scores,
            'total_questions': len(scores),
            'total_weight': total_weight
        }

class CategoryService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_categories(self, language: str = 'en') -> List[Dict[str, Any]]:
        """Get all categories"""
        categories = (
            self.db.query(QuestionCategory)
            .filter(QuestionCategory.is_active == True)
            .order_by(QuestionCategory.weight.desc())
            .all()
        )
        
        return [self._format_category(cat, language) for cat in categories]
    
    def _format_category(self, category: QuestionCategory, language: str) -> Dict[str, Any]:
        """Format category for API response"""
        return {
            'id': category.id,
            'code': category.code,
            'name': category.name_ar if language == 'ar' else category.name_en,
            'name_en': category.name_en,
            'name_ar': category.name_ar,
            'description': category.description_ar if language == 'ar' else category.description_en,
            'weight': category.weight,
            'question_count': len([q for q in category.questions if q.is_active]),
            'is_active': category.is_active
        }
    
    def create_category(self, category_data: Dict[str, Any]) -> QuestionCategory:
        """Create new category"""
        category = QuestionCategory(**category_data)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def update_category(self, category_code: str, updates: Dict[str, Any]) -> Optional[QuestionCategory]:
        """Update existing category"""
        category = self.db.query(QuestionCategory).filter(QuestionCategory.code == category_code).first()
        if not category:
            return None
            
        for key, value in updates.items():
            if hasattr(category, key):
                setattr(category, key, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
