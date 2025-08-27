"""
Backend utilities package for Mystery Shopper application
Contains scoring analysis and question validation utilities
"""

from .scoring_analysis import (
    load_questions_from_csv,
    parse_max_score,
    get_section_weight_mapping,
    get_main_section_mapping,
    calculate_weighted_section_scores,
    analyze_questions_structure,
    get_q51_dependencies
)

from .question_validation import (
    validate_questions_data,
    check_question_consistency,
    get_questions_diagnostics,
    generate_recommendations
)

__all__ = [
    'load_questions_from_csv',
    'parse_max_score', 
    'get_section_weight_mapping',
    'get_main_section_mapping',
    'calculate_weighted_section_scores',
    'analyze_questions_structure',
    'get_q51_dependencies',
    'validate_questions_data',
    'check_question_consistency',
    'get_questions_diagnostics',
    'generate_recommendations'
]