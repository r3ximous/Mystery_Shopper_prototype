#!/usr/bin/env python3
"""
Backend CLI utilities for Mystery Shopper application
Run from the project root directory: python -m app.backend.utils.cli
"""

import sys
import os
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from app.backend.utils.question_validation import (
    validate_questions_data, 
    check_question_consistency,
    get_questions_diagnostics
)
from app.backend.utils.scoring_analysis import (
    analyze_questions_structure,
    get_q51_dependencies,
    load_questions_from_csv
)

def print_json(data, title=""):
    """Pretty print JSON data"""
    if title:
        print(f"\n=== {title} ===")
    print(json.dumps(data, indent=2, ensure_ascii=False))

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print("Usage: python -m app.backend.utils.cli <command>")
        print("Commands:")
        print("  validate      - Validate questions data")
        print("  consistency   - Check data consistency")
        print("  diagnostics   - Full diagnostics")
        print("  structure     - Analyze questions structure")
        print("  q51-deps      - Show Q51 dependencies")
        print("  load-csv      - Load and display CSV data")
        return
    
    command = sys.argv[1].lower()
    
    try:
        if command == 'validate':
            data = validate_questions_data()
            print_json(data, "Questions Validation")
            
        elif command == 'consistency':
            data = check_question_consistency()
            print_json(data, "Data Consistency Check")
            
        elif command == 'diagnostics':
            data = get_questions_diagnostics()
            print_json(data, "Full Diagnostics")
            
        elif command == 'structure':
            data = analyze_questions_structure()
            print_json(data, "Questions Structure Analysis")
            
        elif command == 'q51-deps':
            data = get_q51_dependencies()
            print_json(data, "Q51 Dependencies")
            
        elif command == 'load-csv':
            questions, sections = load_questions_from_csv()
            data = {
                'total_questions': len(questions),
                'sections': {name: len(qs) for name, qs in sections.items()},
                'sample_questions': questions[:5]
            }
            print_json(data, "CSV Data Sample")
            
        else:
            print(f"Unknown command: {command}")
            
    except Exception as e:
        print(f"Error executing command '{command}': {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
