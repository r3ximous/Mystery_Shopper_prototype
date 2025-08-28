"""
Extract all valid question IDs from the questions CSV
"""

import csv
import os

def get_valid_question_ids():
    """Extract all valid question IDs from the CSV"""
    questions_file = os.path.join('app', 'backend', 'core', 'questions.csv')
    
    question_ids = []
    
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['Quet.Nr'] and row['Quet.Nr'].strip():
                    qid = row['Quet.Nr'].strip()
                    if qid not in question_ids:  # Avoid duplicates
                        question_ids.append(qid)
    except Exception as e:
        print(f"Error reading questions: {e}")
        return []
    
    return sorted(question_ids)

if __name__ == "__main__":
    question_ids = get_valid_question_ids()
    print("Valid Question IDs:")
    print(question_ids)
    print(f"\nTotal: {len(question_ids)} questions")