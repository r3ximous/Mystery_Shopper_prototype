#!/usr/bin/env python3
"""
Backend Utility: Analyze conditional questions and their trigger conditions

This script analyzes the conditional logic structure from the questions CSV
to help understand dependencies and trigger patterns.
"""

import sys
import os

# Add the project root and app directory to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'app'))

from app.backend.core.questions import get_questions

def analyze_conditional_questions():
    """Analyze all conditional questions and group by trigger patterns"""
    questions = get_questions()
    conditional_questions = [q for q in questions if q.get('has_conditions', False)]

    print('=== CONDITIONAL QUESTIONS ANALYSIS ===')
    print(f'Total questions: {len(questions)}')
    print(f'Conditional questions: {len(conditional_questions)}')
    print(f'Percentage conditional: {len(conditional_questions)/len(questions)*100:.1f}%')
    print()

    # Group by condition patterns
    condition_patterns = {}
    
    for q in conditional_questions:
        condition = q['conditions']
        if condition not in condition_patterns:
            condition_patterns[condition] = []
        condition_patterns[condition].append(q)

    print('=== CONDITIONS BY PATTERN ===')
    for condition, questions_with_condition in condition_patterns.items():
        print(f'CONDITION: {condition}')
        print(f'Triggers: {len(questions_with_condition)} questions')
        print('-' * 50)
        for q in questions_with_condition:
            print(f'   {q["id"]}: {q["text_en"][:60]}...')
        print()

    # Most common triggers
    print('=== TRIGGER FREQUENCY ===')
    sorted_patterns = sorted(condition_patterns.items(), 
                           key=lambda x: len(x[1]), reverse=True)
    for condition, questions_list in sorted_patterns:
        print(f'{len(questions_list):2d} questions triggered by: {condition}')

def analyze_question_dependencies():
    """Analyze which questions serve as triggers for others"""
    questions = get_questions()
    conditional_questions = [q for q in questions if q.get('has_conditions', False)]
    
    # Find all referenced question IDs in conditions
    trigger_counts = {}
    
    for q in conditional_questions:
        condition = q['conditions']
        # Extract question IDs from conditions (simple pattern matching)
        import re
        referenced_ids = re.findall(r'Q\d+', condition)
        
        for ref_id in referenced_ids:
            if ref_id not in trigger_counts:
                trigger_counts[ref_id] = 0
            trigger_counts[ref_id] += 1
    
    print('\n=== TRIGGER QUESTIONS (Most Important) ===')
    sorted_triggers = sorted(trigger_counts.items(), 
                           key=lambda x: x[1], reverse=True)
    
    for trigger_id, count in sorted_triggers:
        # Find the actual question
        trigger_question = None
        for q in questions:
            if q['id'] == trigger_id:
                trigger_question = q
                break
        
        if trigger_question:
            text = trigger_question['text_en'][:50] + '...' if len(trigger_question['text_en']) > 50 else trigger_question['text_en']
            print(f'{trigger_id} ({count} dependencies): {text}')
        else:
            print(f'{trigger_id} ({count} dependencies): [Question not found]')

if __name__ == "__main__":
    analyze_conditional_questions()
    analyze_question_dependencies()