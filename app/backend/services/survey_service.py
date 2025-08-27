from datetime import datetime
from ..schemas.survey import SurveySubmissionIn, SurveySubmissionOut
from ..core.security import sanitize_text
from ..core.questions import get_questions
from ..utils.scoring_analysis import (
    parse_max_score, 
    get_section_weight_mapping, 
    calculate_weighted_section_scores
)
from typing import List, Dict, Any
import csv
import os

_DB: List[SurveySubmissionOut] = []
_COUNTER = 1

def get_questions_dict() -> Dict[str, str]:
    """Get all questions as a dictionary for validation"""
    questions = get_questions()
    return {q['id']: q['text_en'] for q in questions}

def get_section_weights() -> Dict[str, Dict[str, Any]]:
    """Get section weights based on the scoring system"""
    # Use the utility function from scoring_analysis
    weight_mapping = get_section_weight_mapping()
    
    # Transform to the format expected by the frontend
    section_weights = {}
    main_sections = {}
    
    for section, info in weight_mapping.items():
        display_name = info['display_name']
        weight = info['weight']
        
        if display_name not in main_sections:
            main_sections[display_name] = {'weight': 0, 'sections': []}
        
        main_sections[display_name]['weight'] += weight
        main_sections[display_name]['sections'].append(section)
    
    return main_sections

def get_question_max_scores() -> Dict[str, int]:
    """Get maximum possible scores for each question by parsing CSV"""
    max_scores = {}
    questions_file = os.path.join(os.path.dirname(__file__), '..', 'core', 'questions.csv')
    
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['Quet.Nr'] and row['Possible Answers']:
                    question_id = row['Quet.Nr'].strip()
                    answers = row['Possible Answers'].strip()
                    max_scores[question_id] = parse_max_score(answers)
    except Exception as e:
        print(f"Error loading question scores: {e}")
    
    return max_scores

def parse_max_score(answers: str) -> int:
    """Parse the maximum score from possible answers"""
    if not answers:
        return 1
    
    # Look for numbers in parentheses like (2), (1), (0)
    import re
    scores = re.findall(r'\((\d+)\)', answers)
    if scores:
        return max(int(s) for s in scores)
    
    # Count options (simple fallback)
    lines = [line.strip() for line in answers.split('\n') if line.strip()]
    return len(lines) if lines else 1

def get_question_sections() -> Dict[str, str]:
    """Get section mapping for each question"""
    question_sections = {}
    questions_file = os.path.join(os.path.dirname(__file__), '..', 'core', 'questions.csv')
    
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['Quet.Nr'] and row['Criteria']:
                    question_id = row['Quet.Nr'].strip()
                    section = row['Criteria'].strip()
                    question_sections[question_id] = section
    except Exception as e:
        print(f"Error loading question sections: {e}")
    
    return question_sections

QUESTIONS = get_questions_dict()
SECTION_WEIGHTS = get_section_weights()
QUESTION_MAX_SCORES = get_question_max_scores()
QUESTION_SECTIONS = get_question_sections()

CHANNEL_WEIGHTS = {
    "CALL_CENTER": 1.0,
    "ON_SITE": 1.1,
    "WEB": 0.9,
    "MOBILE_APP": 1.0,
}

ALLOWED_CHANNELS = {"CALL_CENTER","ON_SITE","WEB","MOBILE_APP"}

def save_submission(payload: SurveySubmissionIn) -> SurveySubmissionOut:
    global _COUNTER
    # Basic validation: ensure all question ids exist
    for qs in payload.scores:
        if qs.question_id not in QUESTIONS:
            raise ValueError(f"Invalid question id: {qs.question_id}")
    if payload.channel not in ALLOWED_CHANNELS:
        raise ValueError("Unsupported channel")
    # Additional sanitization safeguard (schema already sanitized identifiers)
    payload.location_code = sanitize_text(payload.location_code)
    payload.shopper_id = sanitize_text(payload.shopper_id)
    submission = SurveySubmissionOut(
        id=_COUNTER,
        created_at=datetime.utcnow(),
        **payload.model_dump()
    )
    _DB.append(submission)
    _COUNTER += 1
    return submission

def list_submissions() -> List[SurveySubmissionOut]:
    return _DB

def calculate_section_scores(submission: SurveySubmissionOut) -> Dict[str, Any]:
    """Calculate weighted section scores for a submission"""
    section_scores = {}
    
    # Group questions by main sections
    main_section_questions = {}
    for main_section, config in SECTION_WEIGHTS.items():
        main_section_questions[main_section] = []
        for section_name in config['sections']:
            for question_id, question_section in QUESTION_SECTIONS.items():
                if question_section == section_name:
                    main_section_questions[main_section].append(question_id)
    
    # Calculate scores for each main section
    for main_section, question_ids in main_section_questions.items():
        if not question_ids:
            continue
            
        section_total = 0
        section_max = 0
        section_count = 0
        
        for question_id in question_ids:
            max_score = QUESTION_MAX_SCORES.get(question_id, 1)
            
            # Find actual score for this question
            actual_score = 0
            for score_item in submission.scores:
                if score_item.question_id == question_id:
                    actual_score = score_item.score
                    break
            
            section_total += actual_score
            section_max += max_score
            section_count += 1
        
        # Calculate section percentage
        if section_max > 0:
            section_percentage = section_total / section_max
            weight = SECTION_WEIGHTS[main_section]['weight']
            section_scores[main_section] = {
                'score': round(section_percentage, 4),
                'weight': weight,
                'weighted_score': round(section_percentage * weight, 4),
                'questions_count': section_count,
                'raw_total': section_total,
                'raw_max': section_max
            }
    
    # Calculate overall score
    total_weighted_score = sum(s['weighted_score'] for s in section_scores.values())
    total_weight = sum(s['weight'] for s in section_scores.values())
    overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
    
    return {
        'section_scores': section_scores,
        'overall_score': round(overall_score, 4),
        'total_weighted_score': round(total_weighted_score, 4),
        'total_weight_used': round(total_weight, 4)
    }

def basic_metrics() -> Dict[str, Any]:
    if not _DB:
        return {"total": 0, "avg_score": None, "channel_breakdown": {}, "section_breakdown": {}}
    
    # Calculate individual submission scores
    submission_scores = []
    channel_scores: Dict[str, list] = {}
    section_aggregates = {}
    
    for sub in _DB:
        # Calculate weighted section scores
        score_data = calculate_section_scores(sub)
        submission_scores.append({
            'id': sub.id,
            'channel': sub.channel,
            'overall_score': score_data['overall_score'],
            'section_scores': score_data['section_scores']
        })
        
        # Group by channel
        channel_scores.setdefault(sub.channel, []).append(score_data['overall_score'])
        
        # Aggregate section scores
        for section, data in score_data['section_scores'].items():
            if section not in section_aggregates:
                section_aggregates[section] = []
            section_aggregates[section].append(data['score'])
    
    # Calculate averages
    overall_avg = sum(s['overall_score'] for s in submission_scores) / len(submission_scores)
    channel_breakdown = {ch: round(sum(vals)/len(vals), 4) for ch, vals in channel_scores.items()}
    section_breakdown = {section: round(sum(scores)/len(scores), 4) for section, scores in section_aggregates.items()}
    
    return {
        "total": len(_DB),
        "avg_score": round(overall_avg, 4),
        "channel_breakdown": channel_breakdown,
        "section_breakdown": section_breakdown,
        "section_weights": {k: v['weight'] for k, v in SECTION_WEIGHTS.items()},
        "detailed_scores": submission_scores[-10:]  # Last 10 submissions with details
    }
