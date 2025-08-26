"""Single source of truth for survey questions (id, English & Arabic text)."""

import csv
import os
from typing import List, Dict, Any, Optional

def parse_questions_from_csv() -> List[Dict[str, Any]]:
    """Parse the comprehensive questions.csv file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = os.path.join(script_dir, "questions.csv")
    
    questions = []
    questions_dict = {}  # Use dict to handle duplicates - last one wins
    
    try:
        with open(filename, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Skip empty rows or rows without question numbers
                if not row.get('Quet.Nr') or row.get('Quet.Nr').strip() in ['', 'Quet.Nr']:
                    continue
                
                question_id = row.get('Quet.Nr', '').strip()
                if not question_id.startswith('Q'):
                    continue
                
                # Skip rows marked for deletion
                changes_made = row.get('Changes made', '').strip().lower()
                if 'to be deleted' in changes_made:
                    continue
                    
                # Parse answer format to determine question type
                possible_answers = row.get('Possible Answers', '').strip()
                question_type = 'rating'  # default
                answer_options = []
                max_score = 5
                
                # Check for various Yes/No patterns
                is_yes_no = False
                yes_score = 1
                no_score = 0
                
                # Look for Yes/No patterns with different scores
                if ('Yes (' in possible_answers and 'No (' in possible_answers) or \
                   ('نعم (' in possible_answers and 'لا (' in possible_answers):
                    # Extract the scores for Yes and No
                    import re
                    yes_match = re.search(r'(?:Yes|نعم)\s*\((\d+)\)', possible_answers)
                    no_match = re.search(r'(?:No|لا)\s*\((\d+)\)', possible_answers)
                    
                    if yes_match and no_match:
                        yes_score = int(yes_match.group(1))
                        no_score = int(no_match.group(1))
                        is_yes_no = True
                
                if is_yes_no:
                    question_type = 'yes_no'
                    answer_options = [
                        {'value': yes_score, 'label_en': 'Yes', 'label_ar': 'نعم'},
                        {'value': no_score, 'label_en': 'No', 'label_ar': 'لا'}
                    ]
                    max_score = max(yes_score, no_score)
                elif '(3)' in possible_answers or '(2)' in possible_answers or '(1)' in possible_answers:
                    # Multi-option questions - parse the options
                    question_type = 'multiple_choice'
                    lines = possible_answers.split('\n')
                    for line in lines:
                        if '(' in line and ')' in line:
                            # Extract score and text
                            start = line.find('(')
                            end = line.find(')')
                            if start != -1 and end != -1:
                                try:
                                    score = int(line[start+1:end])
                                    text = line[:start].strip()
                                    if text:
                                        answer_options.append({
                                            'value': score,
                                            'label_en': text,
                                            'label_ar': text  # Would need translation
                                        })
                                        max_score = max(max_score, score)
                                except ValueError:
                                    continue
                
                # Skip questions with complex conditional logic for now
                skips_triggers = row.get('Skips & Triggers', '').strip()
                has_conditions = bool(skips_triggers and skips_triggers not in ['', 'N/A'])
                
                questions_dict[question_id] = {
                    'id': question_id,
                    'text_en': row.get('Question', '').strip(),
                    'text_ar': row.get('السؤال', '').strip(),
                    'elaboration_en': row.get('Elaboration on Question', '').strip(),
                    'category': row.get('Criteria', '').strip(),
                    'question_type': question_type,
                    'answer_options': answer_options,
                    'max_score': max_score,
                    'has_conditions': has_conditions,
                    'conditions': skips_triggers,
                    'visit_type': row.get('Type of visit', '').strip()
                }
    
    except FileNotFoundError:
        print(f"Warning: questions.csv not found at {filename}")
        return get_fallback_questions()
    except Exception as e:
        print(f"Error parsing questions.csv: {e}")
        return get_fallback_questions()
    
    # Convert dict to list, preserving order by question ID
    questions = list(questions_dict.values())
    return questions

def get_fallback_questions() -> List[Dict[str, Any]]:
    """Fallback questions if CSV parsing fails"""
    return [
        {
            "id": "Q1", 
            "text_en": "Were the directions on signboards clear enough to guide you?",
            "text_ar": "هل كانت الارشادات على اللوحات واضحة بشكل كافي؟",
            "category": "Center Access",
            "question_type": "rating",
            "answer_options": [],
            "max_score": 5,
            "has_conditions": False
        },
        {
            "id": "Q6",
            "text_en": "Was the exterior area around the building clean and well maintained?", 
            "text_ar": "هل كان محيط المبـنى الخارجي نظيفا وفي حالة جيدة؟",
            "category": "Premises Exterior",
            "question_type": "rating", 
            "answer_options": [],
            "max_score": 5,
            "has_conditions": False
        }
    ]

def get_questions():
    """Returns all parsed questions from CSV"""
    return parse_questions_from_csv()

def get_questions_by_category():
    """Group questions by category for better organization"""
    questions = get_questions()
    categories = {}
    
    for q in questions:
        category = q.get('category', 'Other')
        if category not in categories:
            categories[category] = []
        categories[category].append(q)
    
    return categories
    return questions
