# Test File Organization Update

## Files Moved to `/tests` Directory

The following testing and debugging related files have been moved from the root directory to the `/tests` folder for better organization:

### ✅ **Moved Files:**

1. **`debug_voice_submit.js`**
   - **From**: `/debug_voice_submit.js`
   - **To**: `/tests/debug_voice_submit.js`
   - **Purpose**: Browser console diagnostic script for voice mode form submission issues

2. **`debug_test.html`**
   - **From**: `/debug_test.html`  
   - **To**: `/tests/debug_test.html`
   - **Purpose**: Standalone HTML page for testing debug mode UI functionality

3. **`test_api_pytest.py`**
   - **From**: `/app/backend/tests/test_api.py`
   - **To**: `/tests/test_api_pytest.py`
   - **Purpose**: Pytest-based API testing with async client

### 📝 **Updated Documentation:**

- **`tests/README.md`** - Updated to include documentation for the moved debug utilities
- Added sections for "Debugging and Diagnostic Tools" and "Utility Scripts"

## Current Test Directory Structure

```
tests/
├── README.md (updated)
├── Core System Tests/
│   ├── test_question_system.py
│   └── test_direct.py
├── API Integration Tests/
│   ├── simple_test.py
│   ├── test_connectivity.py
│   ├── test_8001.py
│   ├── test_correct_path.py
│   └── test_web_interface.py
├── Debugging Tools/
│   ├── debug_api.py
│   ├── debug_voice_submit.js (moved)
│   └── debug_test.html (moved)
├── Utility Scripts/
│   ├── check_questions.py
│   ├── system_status.py
│   └── run_full_test.py
└── Test Data/
    └── test_payload.json
```

## Benefits of Organization

1. **Centralized Testing**: All testing-related files are now in one location
2. **Clear Separation**: Testing code is separated from production code
3. **Better Discovery**: Developers can easily find all testing utilities
4. **Consistent Structure**: Follows common project organization patterns
5. **Updated Documentation**: README.md provides comprehensive overview of all tools

## Usage Notes

- **Debug scripts**: Can still be run the same way, just reference the new path
- **HTML test page**: Open `/tests/debug_test.html` in browser
- **JavaScript debug script**: Copy content and paste in browser console when needed
- **API debug script**: Run with `python tests/debug_api.py`

All functionality remains the same - only the file locations have changed for better organization.
