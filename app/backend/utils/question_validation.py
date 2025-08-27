"""
Question data validation utilities for the Mystery Shopper backend
Provides functions to validate and check question data integrity
"""

from typing import Dict, List, Any
from ..core.questions import get_questions
from .scoring_analysis import load_questions_from_csv, get_q51_dependencies, analyze_questions_structure

def validate_questions_data() -> Dict[str, Any]:
    """Validate questions data passed to frontend"""
    
    questions = get_questions()
    questions_csv, sections = load_questions_from_csv()
    
    # Find conditional questions
    conditional_questions = [q for q in questions_csv if q.get('has_conditions', False)]
    
    # Find Q51 dependencies
    q51_deps = get_q51_dependencies()
    
    # Compare frontend vs CSV data
    frontend_ids = set(q['id'] for q in questions)
    csv_ids = set(q['id'] for q in questions_csv)
    
    missing_in_frontend = csv_ids - frontend_ids
    extra_in_frontend = frontend_ids - csv_ids
    
    validation_result = {
        'status': 'valid' if len(missing_in_frontend) == 0 and len(extra_in_frontend) == 0 else 'issues_found',
        'total_questions_frontend': len(questions),
        'total_questions_csv': len(questions_csv),
        'conditional_questions_count': len(conditional_questions),
        'q51_dependent_questions_count': len(q51_deps),
        'missing_in_frontend': list(missing_in_frontend),
        'extra_in_frontend': list(extra_in_frontend),
        'sections': {name: len(qs) for name, qs in sections.items()},
        'conditional_questions_sample': [
            {
                'id': q['id'],
                'section': q['section'], 
                'has_conditions': q['has_conditions'],
                'conditions': q['conditions'][:100] + '...' if len(q['conditions']) > 100 else q['conditions']
            } for q in conditional_questions[:10]  # First 10 for overview
        ],
        'q51_dependencies': q51_deps
    }
    
    return validation_result

def check_question_consistency() -> Dict[str, Any]:
    """Check consistency between different question data sources"""
    
    frontend_questions = get_questions()
    csv_questions, csv_sections = load_questions_from_csv()
    
    # Create lookup dictionaries
    frontend_lookup = {q['id']: q for q in frontend_questions}
    csv_lookup = {q['id']: q for q in csv_questions}
    
    consistency_issues = []
    
    # Check each question in both sources
    all_question_ids = set(frontend_lookup.keys()) | set(csv_lookup.keys())
    
    for qid in all_question_ids:
        frontend_q = frontend_lookup.get(qid)
        csv_q = csv_lookup.get(qid)
        
        if not frontend_q:
            consistency_issues.append({
                'question_id': qid,
                'issue': 'missing_in_frontend',
                'details': f'Question exists in CSV but not in frontend'
            })
        elif not csv_q:
            consistency_issues.append({
                'question_id': qid,
                'issue': 'missing_in_csv',
                'details': f'Question exists in frontend but not in CSV'
            })
        else:
            # Compare question text
            if frontend_q.get('text_en', '') != csv_q.get('question_en', ''):
                consistency_issues.append({
                    'question_id': qid,
                    'issue': 'text_mismatch',
                    'details': f'Question text differs between sources'
                })
    
    return {
        'total_issues': len(consistency_issues),
        'issues': consistency_issues[:20],  # First 20 issues
        'summary': {
            'frontend_questions': len(frontend_questions),
            'csv_questions': len(csv_questions),
            'common_questions': len(set(frontend_lookup.keys()) & set(csv_lookup.keys())),
            'frontend_only': len(set(frontend_lookup.keys()) - set(csv_lookup.keys())),
            'csv_only': len(set(csv_lookup.keys()) - set(frontend_lookup.keys()))
        }
    }

def get_questions_diagnostics() -> Dict[str, Any]:
    """Get comprehensive diagnostics about questions data"""
    
    validation = validate_questions_data()
    consistency = check_question_consistency()
    structure_analysis = analyze_questions_structure()
    
    return {
        'validation': validation,
        'consistency': consistency,
        'structure': structure_analysis,
        'recommendations': generate_recommendations(validation, consistency)
    }

def generate_recommendations(validation: Dict, consistency: Dict) -> List[str]:
    """Generate recommendations based on validation results"""
    
    recommendations = []
    
    if validation['missing_in_frontend']:
        recommendations.append(
            f"Add {len(validation['missing_in_frontend'])} missing questions to frontend: "
            f"{', '.join(validation['missing_in_frontend'][:5])}{'...' if len(validation['missing_in_frontend']) > 5 else ''}"
        )
    
    if validation['extra_in_frontend']:
        recommendations.append(
            f"Remove {len(validation['extra_in_frontend'])} extra questions from frontend: "
            f"{', '.join(validation['extra_in_frontend'][:5])}{'...' if len(validation['extra_in_frontend']) > 5 else ''}"
        )
    
    if consistency['total_issues'] > 0:
        recommendations.append(
            f"Fix {consistency['total_issues']} consistency issues between frontend and CSV data"
        )
    
    if validation['conditional_questions_count'] > 0:
        recommendations.append(
            f"Implement conditional logic for {validation['conditional_questions_count']} questions with conditions"
        )
    
    if validation['q51_dependent_questions_count'] > 0:
        recommendations.append(
            f"Ensure Q51 conditional logic is working for {validation['q51_dependent_questions_count']} dependent questions"
        )
    
    if not recommendations:
        recommendations.append("Questions data appears to be in good condition")
    
    return recommendations
