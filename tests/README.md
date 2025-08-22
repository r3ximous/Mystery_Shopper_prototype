# Test Suite for Mystery Shopper Application

This directory contains all test files and debugging utilities for the Mystery Shopper voice-driven survey system.

## Test Files

### Core System Tests
- **`test_question_system.py`** - Comprehensive test of the modular question management system
  - Tests question service, category service, database operations
  - Validates scoring calculation with weighted questions
  - Confirms bilingual support (EN/AR)

### API Integration Tests  
- **`test_direct.py`** - Direct internal API testing using service layer
  - Tests submission validation and processing
  - Uses internal modules to bypass HTTP layer
  - Confirms database integration works

- **`simple_test.py`** - HTTP API submission testing
  - Tests survey submission via HTTP requests
  - Validates API endpoint responses
  - Originally used for debugging 422/500 errors

### API Connectivity Tests
- **`test_connectivity.py`** - Basic API endpoint availability testing
  - Tests root endpoint and questions endpoint
  - Validates server is running and responsive

- **`test_8001.py`** - Alternative port testing (port 8001)
  - Used when port 8000 had issues
  - Tests same functionality as simple_test.py

- **`test_correct_path.py`** - Endpoint path validation
  - Tests correct API paths (/survey/submit vs /api/survey/submit)
  - Used to debug routing issues

- **`test_api_pytest.py`** - Pytest-based API testing
  - Uses pytest framework for structured testing
  - Tests API endpoints with async client
  - Originally located in app/backend/tests/

### Comprehensive Testing
- **`run_full_test.py`** - Complete end-to-end system test
  - Tests all API endpoints sequentially
  - Validates complete submission workflow
  - Provides summary of system health

### Debug Utilities
- **`debug_api.py`** - Advanced API debugging with detailed logging
  - Uses httpx for async HTTP testing
  - Provides detailed error reporting

- **`check_questions.py`** - Database question inspection utility
  - Lists all questions in database with status
  - Shows active vs inactive questions
  - Used to debug question ID validation issues

### Test Data
- **`test_payload.json`** - Sample submission payload for manual testing
  - Contains properly formatted survey submission data
  - Used with curl or other HTTP tools

## Usage

### Running Individual Tests
```bash
cd tests/
python test_question_system.py    # Test core functionality
python test_direct.py             # Test internal API
python simple_test.py             # Test HTTP API
python check_questions.py         # Inspect database
python run_full_test.py           # Complete system test
```

### Debugging and Diagnostic Tools
- **`debug_api.py`** - Direct API testing and 422 error debugging
  - Tests survey submission API with custom payloads
  - Useful for diagnosing validation errors
  - Bypasses frontend to test backend directly

- **`debug_voice_submit.js`** - Voice mode form submission diagnostics
  - Browser console script to debug voice mode issues
  - Functions: debugVoiceSubmission(), debugSpeechRecognition(), testManualSubmit()
  - Created to solve voice mode preventing form submission

- **`debug_test.html`** - Debug mode UI testing page
  - Standalone HTML page to test debug mode visibility
  - Tests question codes and weight indicators show/hide functionality
  - Useful for testing localStorage debug state without full survey form

### Utility Scripts
- **`check_questions.py`** - Question inspection and validation utility
  - Lists all questions in database with status information
  - Validates question data integrity
  - Shows active/inactive questions

- **`system_status.py`** - Overall system health check
  - Comprehensive system status verification
  - Tests database connection, API endpoints, question availability

### Prerequisites
- Backend server must be running on port 8000 or 8001
- Database must be initialized with seeded questions
- Required packages: requests, httpx (for some tests)

## Test Results History

### Major Issues Resolved
1. **Question ID Format Mismatch** - Fixed validation to accept new format (SVC_001, FAC_001, etc.)
2. **Database Integration** - Fixed service layer to use database instead of hardcoded questions
3. **API Endpoint Paths** - Corrected routing from `/api/survey/submit` to `/survey/submit`
4. **Inactive Questions** - Identified FAC_001 as inactive, tests updated accordingly

### Current Status
- ✅ Direct API calls working (test_direct.py)
- ✅ Database operations functional (test_question_system.py)
- ✅ Question validation fixed (check_questions.py)
- 🔧 HTTP API integration in progress (simple_test.py)

## Notes
- Some tests may require server restart after code changes
- PowerShell terminal output can be truncated - check server logs for full details
- Active question IDs: SVC_001, SVC_002, SVC_003, FAC_002, EFF_001, EFF_002
