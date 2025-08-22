# Survey Form Refactoring - Externalized Styles and Scripts

## Overview
Moved inline styles and scripts from the survey form template into external files for better code organization and maintainability.

## Changes Made

### 1. Moved CSS Styles
**From**: `app/frontend/templates/survey_form.html` (inline `<style>` tag)
**To**: `app/frontend/static/style.css` (appended to existing styles)

**Styles moved:**
- `.weight-indicator` - Question weight display styling
- `.question-text` - Question text transition effects
- `[dir="rtl"]` rules - Right-to-left text direction for Arabic
- `.lang-ar` - Language-specific Arabic styling

### 2. Created External JavaScript File
**New file**: `app/frontend/static/js/survey_form.js`

**Functions extracted:**
- `switchLanguage()` - Language switching functionality
- `updateQuestionTexts()` - Updates question text based on language
- `updateDebugVisibility()` - Controls debug-only element visibility
- `initSurveyForm()` - Initializes the form functionality

### 3. Updated Template
**File**: `app/frontend/templates/survey_form.html`

**Changes:**
- Removed inline `<style>` block
- Removed inline `<script>` block with all functions
- Added reference to external JavaScript file: `/static/js/survey_form.js`
- Kept minimal inline script for backend data injection:
  - `window.__SURVEY_QUESTIONS` (survey questions data)
  - `window.__CURRENT_LANGUAGE` (current language setting)

## File Structure After Refactoring

```
app/frontend/
├── static/
│   ├── style.css (updated - contains survey form styles)
│   └── js/
│       ├── survey_form.js (new - form-specific logic)
│       └── survey_main.js (existing - main survey functionality)
└── templates/
    └── survey_form.html (cleaned up - no inline styles/scripts)
```

## Benefits

1. **Better Code Organization**: Separate concerns between presentation (CSS), behavior (JS), and structure (HTML)
2. **Improved Maintainability**: Styles and scripts are easier to find and modify
3. **Better Caching**: External files can be cached by browsers
4. **Cleaner Templates**: HTML templates are more readable without inline code
5. **Reusability**: External CSS and JS can be shared across multiple templates if needed

## Global Variables

The template still injects necessary data via minimal inline scripts:
- `window.__SURVEY_QUESTIONS` - Survey questions from backend
- `window.__CURRENT_LANGUAGE` - Current language setting ('en' or 'ar')

## Functions Available Globally

- `switchLanguage(newLang)` - Used by the language select dropdown
- All other functions are scoped to the module and called via event listeners

## Testing

The refactoring maintains all existing functionality:
- Language switching works correctly
- Debug mode toggle still controls question codes and weight visibility
- All styling remains unchanged
- Form initialization happens on DOM ready

## Future Improvements

This refactoring sets the foundation for:
- Easier style customization
- Better code reuse across different form templates
- Simplified testing of individual components
- Better development workflow with separate files
