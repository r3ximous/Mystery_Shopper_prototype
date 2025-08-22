"""
Database models for question management system
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class QuestionCategory(Base):
    __tablename__ = "question_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)  # e.g., "SERVICE", "FACILITY"
    name_en = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=False)
    description_en = Column(Text)
    description_ar = Column(Text)
    weight = Column(Float, default=1.0)  # Category weight in overall score
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="category")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)  # e.g., "SVC_001"
    category_id = Column(Integer, ForeignKey("question_categories.id"))
    
    # Bilingual text
    text_en = Column(String(500), nullable=False)
    text_ar = Column(String(500), nullable=False)
    
    # Help text / instructions
    help_en = Column(Text)
    help_ar = Column(Text)
    
    # Scoring configuration
    weight = Column(Float, default=1.0)  # Question weight within category
    min_score = Column(Integer, default=1)
    max_score = Column(Integer, default=5)
    
    # Display configuration
    display_order = Column(Integer, default=0)
    is_required = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(50))  # Future: user ID
    
    category = relationship("QuestionCategory", back_populates="questions")
    responses = relationship("SurveyResponse", back_populates="question")

class Survey(Base):
    __tablename__ = "surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(20), nullable=False)
    location_code = Column(String(20), nullable=False)
    shopper_id = Column(String(20), nullable=False)
    visit_datetime = Column(DateTime, nullable=False)
    
    # Calculated scores
    total_score = Column(Float)
    category_scores = Column(Text)  # JSON string of category scores
    
    # Metadata
    submitted_at = Column(DateTime, default=datetime.utcnow)
    language = Column(String(5), default='en')  # 'en' or 'ar'
    latency_data = Column(Text)  # JSON string of response times
    
    responses = relationship("SurveyResponse", back_populates="survey")

class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    
    score = Column(Integer, nullable=False)
    comment = Column(Text)
    response_time_ms = Column(Float)  # Voice response latency
    
    survey = relationship("Survey", back_populates="responses")
    question = relationship("Question", back_populates="responses")
