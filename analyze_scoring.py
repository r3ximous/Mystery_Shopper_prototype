"""
Script to analyze questions structure and implement proper scoring weights
"""

import csv
import os
from typing import Dict, List, Any, Optional

def load_questions_from_csv():
    """Load questions from CSV and map them to sections with proper weights"""
    questions_file = os.path.join(
        os.path.dirname(__file__), 
        'app', 'backend', 'core', 'questions.csv'
    )
    
    questions = []
    sections = {}
    
    with open(questions_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Quet.Nr'] and row['Question']:
                question_id = row['Quet.Nr'].strip()
                section = row['Criteria'].strip()
                
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
                    'visit_type': row['Type of visit'].strip()
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

def map_sections_to_weights():
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

def calculate_section_scores(submissions: List[Dict], questions: List[Dict]) -> Dict[str, Any]:
    """Calculate section scores based on weighted criteria"""
    if not submissions:
        return {}
    
    # Create question lookup
    question_lookup = {q['id']: q for q in questions}
    section_weights = map_sections_to_weights()
    
    # Group questions by main sections
    section_groups = {}
    for q in questions:
        section = q['section']
        # Map specific sections to main categories
        main_section = get_main_section(section)
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
            'total_weighted_score': total_weighted_score
        })
    
    return submission_scores

def get_main_section(section_name: str) -> str:
    """Map specific sections to main scoring categories"""
    section_mapping = {
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
    
    return section_mapping.get(section_name, section_name)

if __name__ == "__main__":
    questions, sections = load_questions_from_csv()
    print(f"Loaded {len(questions)} questions across {len(sections)} sections")
    print("\nSections:")
    for section, question_ids in sections.items():
        print(f"  {section}: {len(question_ids)} questions")
