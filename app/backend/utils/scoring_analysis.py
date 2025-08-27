"""
Scoring analysis utilities for the Mystery Shopper backend
Provides functions to analyze questions structure and calculate proper scoring weights
"""

import csv
import os
from typing import Dict, List, Any, Optional
from ..core.questions import get_questions

def load_questions_from_csv() -> tuple[List[Dict], Dict[str, List]]:
    """Load questions from CSV and map them to sections with proper weights"""
    questions_file = os.path.join(
        os.path.dirname(__file__), '..', 'core', 'questions.csv'
    )
    
    questions = []
    sections = {}
    
    with open(questions_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Quet.Nr'] and row['Question']:
                question_id = row['Quet.Nr'].strip()
                section = row['Criteria'].strip()
                
                # Skip deleted questions
                if question_id.endswith('_DELETED') or row.get('Status') == 'DELETED':
                    continue
                
                # Parse possible answers to determine max score
                answers = row['Possible Answers'].strip()
                max_score = parse_max_score(answers)
                
                question_data = {
                    'id': question_id,
                    'section': section,
                    'question_en': row['Question'].strip(),
                    'question_ar': row['السؤال'].strip() if row['السؤال'] else '',
                    'answers': answers,
                    'max_score': max_score,
                    'visit_type': row['Type of visit'].strip(),
                    'has_conditions': bool(row.get('Conditions', '').strip()),
                    'conditions': row.get('Conditions', '').strip()
                }
                
                questions.append(question_data)
                
                # Track sections
                if section not in sections:
                    sections[section] = []
                sections[section].append(question_id)
    
    return questions, sections

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

def get_section_weight_mapping() -> Dict[str, Dict[str, Any]]:
    """Map sections based on the overall_scores.csv structure"""
    return {
        # Main sections with their weights from overall_scores.csv
        'Center Access': {'weight': 0.05, 'display_name': 'Appearance'},
        'Facilities Parking': {'weight': 0.05, 'display_name': 'Appearance'}, 
        'Premises Exterior': {'weight': 0.05, 'display_name': 'Appearance'},
        'Premises Interior': {'weight': 0.05, 'display_name': 'Appearance'},
        'Waiting Area': {'weight': 0.05, 'display_name': 'Appearance'},
        'People of Determination': {'weight': 0.15, 'display_name': 'Service Accessibility'},
        'Service Accessibility': {'weight': 0.15, 'display_name': 'Service Accessibility'},
        'Professionalism of Staff': {'weight': 0.20, 'display_name': 'Professionalism of Staff'},
        'Speed of Service': {'weight': 0.20, 'display_name': 'Speed of Service'},
        'Ease of use': {'weight': 0.20, 'display_name': 'Ease of use'},
        'Service Information Quality': {'weight': 0.15, 'display_name': 'Service Information Quality'},
        'Customer privacy': {'weight': 0.05, 'display_name': 'Customer privacy'},
        'Customer effort': {'weight': 0.0, 'display_name': 'Customer effort'}  # Not included in main scoring
    }

def get_main_section_mapping() -> Dict[str, str]:
    """Map specific sections to main scoring categories"""
    return {
        'Center Access': 'Appearance',
        'Facilities Parking': 'Appearance',
        'Premises Exterior': 'Appearance', 
        'Premises Interior': 'Appearance',
        'Waiting Area': 'Appearance',
        'People of Determination': 'Service Accessibility',
        'Service Accessibility': 'Service Accessibility',
        'Professionalism of Staff': 'Professionalism of Staff',
        'Speed of Service': 'Speed of Service',
        'Ease of use': 'Ease of use',
        'Service Information Quality': 'Service Information Quality',
        'Customer privacy': 'Customer privacy',
        'Customer effort': 'Customer effort'
    }

def calculate_weighted_section_scores(submissions: List[Dict], questions: List[Dict]) -> Dict[str, Any]:
    """Calculate section scores based on weighted criteria"""
    if not submissions:
        return {}
    
    # Create question lookup
    question_lookup = {q['id']: q for q in questions}
    section_weights = get_section_weight_mapping()
    main_section_mapping = get_main_section_mapping()
    
    # Group questions by main sections
    section_groups = {}
    for q in questions:
        section = q['section']
        main_section = main_section_mapping.get(section, section)
        if main_section not in section_groups:
            section_groups[main_section] = []
        section_groups[main_section].append(q)
    
    # Calculate scores per submission
    submission_scores = []
    
    for submission in submissions:
        section_scores = {}
        
        for main_section, section_questions in section_groups.items():
            if main_section not in section_weights:
                continue
                
            section_total = 0
            section_max = 0
            section_count = 0
            
            for question in section_questions:
                question_id = question['id']
                max_score = question['max_score']
                
                # Find score for this question in submission
                actual_score = 0
                for score_item in submission.get('scores', []):
                    if score_item['question_id'] == question_id:
                        actual_score = score_item['score']
                        break
                
                section_total += actual_score
                section_max += max_score
                section_count += 1
            
            # Calculate section percentage
            if section_max > 0:
                section_percentage = section_total / section_max
                section_scores[main_section] = {
                    'score': section_percentage,
                    'weight': section_weights[main_section]['weight'],
                    'weighted_score': section_percentage * section_weights[main_section]['weight'],
                    'questions_count': section_count,
                    'raw_total': section_total,
                    'raw_max': section_max,
                    'display_name': section_weights[main_section]['display_name']
                }
        
        # Calculate overall score
        total_weighted_score = sum(s['weighted_score'] for s in section_scores.values())
        total_weight = sum(s['weight'] for s in section_scores.values())
        
        overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
        
        submission_scores.append({
            'submission_id': submission.get('id'),
            'section_scores': section_scores,
            'overall_score': overall_score,
            'total_weighted_score': total_weighted_score,
            'total_weight_used': total_weight
        })
    
    return submission_scores

def analyze_questions_structure() -> Dict[str, Any]:
    """Analyze the current questions structure for debugging"""
    questions = get_questions()
    questions_csv, sections = load_questions_from_csv()
    
    conditional_questions = [q for q in questions_csv if q.get('has_conditions', False)]
    
    analysis = {
        'total_questions': len(questions),
        'total_csv_questions': len(questions_csv),
        'sections_count': len(sections),
        'conditional_questions_count': len(conditional_questions),
        'sections': {name: len(qs) for name, qs in sections.items()},
        'conditional_questions': [
            {
                'id': q['id'],
                'section': q['section'],
                'conditions': q['conditions']
            } for q in conditional_questions[:10]  # First 10 for brevity
        ]
    }
    
    return analysis

def get_q51_dependencies() -> List[Dict]:
    """Get all questions that depend on Q51"""
    questions_csv, _ = load_questions_from_csv()
    q51_deps = [
        q for q in questions_csv 
        if q.get('conditions', '').lower().find('q51') != -1
    ]
    
    return [
        {
            'id': q['id'],
            'section': q['section'],
            'question': q['question_en'][:100] + '...' if len(q['question_en']) > 100 else q['question_en'],
            'conditions': q['conditions']
        } for q in q51_deps
    ]
