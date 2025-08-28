# Backend Tests

This directory contains all test files and utilities for the Mystery Shopper backend system.

## Directory Structure

```
app/backend/tests/
├── __init__.py                      # Package initialization
├── README.md                        # This documentation
├── test_api.py                      # Original API tests
├── test_form_submission.py          # Form submission functionality tests
├── test_routes.py                   # Route discovery tests
├── test_direct_submission.py        # Direct submission tests
├── test_admin_verification.py       # Admin dashboard data verification
├── test_admin_api_structure.py      # Admin API structure validation
├── test_route_availability.py       # Route availability testing
└── utilities/                       # Test utilities and data generators
    ├── __init__.py                  # Utilities package initialization
    ├── create_complete_test_db.py   # Comprehensive test database generator
    ├── populate_via_api.py          # API-based data population
    ├── quick_populate.py            # Quick data population utility
    └── get_question_ids.py          # Question ID extraction utility
```

## Test Files Description

### Core Tests
- **`test_api.py`** - Original backend API functionality tests
- **`test_form_submission.py`** - Tests the survey form submission process end-to-end
- **`test_routes.py`** - Tests route discovery and endpoint availability
- **`test_direct_submission.py`** - Tests direct submission functionality
- **`test_admin_verification.py`** - Verifies admin dashboard data access and display
- **`test_admin_api_structure.py`** - Validates admin API response structure
- **`test_route_availability.py`** - Tests availability of various application routes

### Utilities
- **`create_complete_test_db.py`** - Generates comprehensive dummy database with 100+ realistic submissions
- **`populate_via_api.py`** - Populates data through actual API endpoints for testing
- **`quick_populate.py`** - Quick utility for basic data population
- **`get_question_ids.py`** - Extracts valid question IDs from the questions CSV file

## Running Tests

### From Project Root
```bash
# Run all tests
python -m pytest app/backend/tests/

# Run specific test file
python app/backend/tests/test_form_submission.py

# Run utilities
python app/backend/tests/utilities/populate_via_api.py
```

### From Tests Directory
```bash
cd app/backend/tests/

# Run individual tests
python test_form_submission.py
python test_admin_verification.py

# Run utilities
python utilities/populate_via_api.py
python utilities/create_complete_test_db.py
```

## Test Data Generation

To populate the system with comprehensive test data:

1. **Quick Population**: `python utilities/populate_via_api.py`
2. **Comprehensive Database**: `python utilities/create_complete_test_db.py`
3. **API-based Population**: `python utilities/populate_via_api.py`

## Requirements

All test files require:
- Server running on `http://127.0.0.1:8000`
- `requests` library for HTTP testing
- Admin API key: `dev-admin-key`

## Test Coverage

- ✅ Form submission functionality
- ✅ API endpoint validation
- ✅ Route availability testing
- ✅ Admin dashboard data access
- ✅ Database population utilities
- ✅ Question ID validation
- ✅ Comprehensive dummy data generation