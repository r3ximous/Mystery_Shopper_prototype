# Backend Utilities Documentation

## Overview

The backend utilities provide comprehensive analysis and validation tools for the Mystery Shopper application's question and scoring system.

## Location

All utilities are located in `app/backend/utils/`:
- `scoring_analysis.py` - Scoring system analysis and weighted calculations
- `question_validation.py` - Question data validation and consistency checks
- `cli.py` - Command-line interface for running utilities

## Usage

### Command Line Interface

Run from the project root directory:

```bash
# Validate questions data
python -m app.backend.utils.cli validate

# Check data consistency
python -m app.backend.utils.cli consistency

# Full diagnostics (combines all checks)
python -m app.backend.utils.cli diagnostics

# Analyze questions structure
python -m app.backend.utils.cli structure

# Show Q51 dependencies
python -m app.backend.utils.cli q51-deps

# Load and display CSV data sample
python -m app.backend.utils.cli load-csv
```

### API Endpoints

The utilities are also available through admin API endpoints:

```
GET /api/admin/questions/diagnostics - Full diagnostics
GET /api/admin/questions/validation - Validation results
GET /api/admin/questions/structure - Structure analysis
GET /api/admin/questions/q51-dependencies - Q51 dependencies
```

All endpoints require admin authentication (`X-API-Key: dev-admin-key`).

### Programmatic Usage

Import utilities directly in backend code:

```python
from app.backend.utils.scoring_analysis import (
    calculate_weighted_section_scores,
    get_section_weight_mapping,
    analyze_questions_structure
)

from app.backend.utils.question_validation import (
    validate_questions_data,
    get_questions_diagnostics
)

# Use in your code
diagnostics = get_questions_diagnostics()
section_scores = calculate_weighted_section_scores(submissions, questions)
```

## Key Functions

### Scoring Analysis (`scoring_analysis.py`)

- `load_questions_from_csv()` - Load questions from CSV with proper parsing
- `get_section_weight_mapping()` - Get section weights based on overall_scores.csv
- `calculate_weighted_section_scores()` - Calculate weighted scores for submissions
- `analyze_questions_structure()` - Analyze questions structure for debugging
- `get_q51_dependencies()` - Find questions dependent on Q51

### Question Validation (`question_validation.py`)

- `validate_questions_data()` - Validate frontend vs CSV data consistency
- `check_question_consistency()` - Check for inconsistencies between data sources
- `get_questions_diagnostics()` - Comprehensive diagnostics combining all checks
- `generate_recommendations()` - Generate actionable recommendations

## Benefits

1. **Organized Structure**: All analysis tools are now part of the backend architecture
2. **API Access**: Tools accessible through secure admin endpoints
3. **CLI Interface**: Easy command-line access for development and debugging
4. **Modular Design**: Functions can be imported and used in other backend code
5. **Comprehensive Analysis**: Tools cover validation, consistency, and scoring analysis
6. **Clean Codebase**: Removed standalone scripts cluttering the project root

## Example Output

### Validation Results
```json
{
  "status": "issues_found",
  "total_questions_frontend": 92,
  "total_questions_csv": 94,
  "missing_in_frontend": ["Q75"],
  "sections": {
    "Center Access": 2,
    "Premises Interior": 13,
    // ... more sections
  },
  "recommendations": [
    "Add 1 missing questions to frontend: Q75"
  ]
}
```

### Structure Analysis
```json
{
  "total_questions": 92,
  "sections_count": 16,
  "conditional_questions_count": 0,
  "q51_dependent_questions_count": 0
}
```
