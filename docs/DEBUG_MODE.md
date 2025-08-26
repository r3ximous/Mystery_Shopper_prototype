# Debug Mode for Mystery Shopper Survey

## Overview
The Mystery Shopper application includes a debug mode that provides detailed console logging and visual indicators for troubleshooting conditional questions and survey flow.

## How to Enable Debug Mode

### Method 1: URL Parameter (Temporary)
Add `?debug` to the URL when viewing the survey:
```
http://127.0.0.1:8000/?debug
```

### Method 2: Browser localStorage (Persistent)
Open browser console (F12) and run:
```javascript
localStorage.setItem('survey_debug', 'true');
// Then refresh the page
```

To disable persistent debug mode:
```javascript
localStorage.removeItem('survey_debug');
// Then refresh the page
```

## Debug Features

### Visual Indicators
- **Header Badge**: Shows "(X conditional rules loaded)" next to the survey title
- Only visible when debug mode is active

### Console Logging
When debug mode is active, detailed logs are shown in the browser console:

#### Rule Generation
- `[DEBUG] window.__SURVEY_QUESTIONS available: true`
- `[DEBUG] Questions data: 92 questions`
- `[DEBUG] Processing question Q52: has_conditions=true, conditions="show if Q51 is yes"`
- `[DEBUG] Generated 32 conditional rules from questions data`

#### Conditional Logic Evaluation
- `[DEBUG] Updating conditional questions...`
- `[DEBUG] Evaluating condition: "show if Q51 is yes" for trigger Q51="1"`
- `[DEBUG] Yes condition: "1" = true`
- `[DEBUG] Question Q52 should be visible: true`

#### Question Visibility Updates
- `[DEBUG] Processing conditional question Q52 with rule: {show: "show if Q51 is yes"}`
- `[DEBUG] Trigger question Q51 current value: "1"`
- `[DEBUG] Showing question Q52 (condition met)`

## When Debug Mode is Disabled (Production)

- **No visual indicators** - Clean user interface
- **No console logging** - Better performance
- **Standard user experience** - No technical information visible

## Use Cases

### For Developers
- Troubleshooting conditional question logic
- Verifying CSV data is properly loaded
- Understanding question dependency flow
- Testing new conditional rules

### For Testing
- Validating survey behavior during QA
- Confirming proper question show/hide logic
- Debugging specific question scenarios

## Performance Impact

Debug mode adds minimal overhead:
- ✅ Console logs only when debug is active
- ✅ Visual indicators only shown in debug mode
- ✅ No impact on production users
- ✅ Can be enabled/disabled without code changes

## Example Debug Session

1. Open survey with `?debug` parameter
2. Look for "(32 conditional rules loaded)" in header
3. Open browser console (F12)
4. Navigate through survey questions
5. Watch console logs show conditional logic in real-time
6. Answer trigger questions (like Q51) to see dependent questions appear

This debug system helps ensure the enhanced conditional questions feature works correctly while keeping the production experience clean for end users.