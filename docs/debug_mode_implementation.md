# Debug Mode Implementation for Question Codes and Weights

## Overview
Question codes (badges) and weight indicators are now hidden by default and only visible when debug mode is active.

## Implementation Details

### HTML Changes
- Added `debug-only` class to question code badges and weight indicators
- Set initial `display: none` inline style to hide elements by default

### JavaScript Changes
- Added `updateDebugVisibility()` function that checks `localStorage.getItem('voiceDebugVisible')`
- Elements with `debug-only` class are shown when debug mode is ON, hidden when OFF
- Listens for `toggle-transcript-debug` events to update visibility in real-time

### User Experience

#### Normal Mode (Default)
- Question codes are hidden
- Weight indicators are hidden
- Clean, simplified interface for end users

#### Debug Mode (When activated)
- Question codes visible as badges (e.g., "SVC_001", "FAC_001")
- Weight indicators visible (e.g., "Weight: 1.5x")
- Useful for developers and administrators

## How to Toggle Debug Mode

### Method 1: Debug Button
- Click the "Debug" button in the top navigation
- Button text changes to "Debug On" when active

### Method 2: Keyboard Shortcut
- Press `Ctrl+D` to toggle debug mode

### Method 3: Browser Console
- Run: `localStorage.setItem('voiceDebugVisible', '1')` to enable
- Run: `localStorage.setItem('voiceDebugVisible', '0')` to disable
- Refresh page or dispatch event: `window.dispatchEvent(new CustomEvent('toggle-transcript-debug'))`

## Code Locations

### Template Changes
File: `app/frontend/templates/survey_form.html`
- Question badges: `<span class="badge debug-only" style="display: none;">{{ q.id }}</span>`
- Weight indicators: `<div class="weight-indicator debug-only" style="display: none;">Weight: {{ q.weight }}x</div>`

### JavaScript Functions
- `updateDebugVisibility()`: Controls visibility of debug elements
- Event listener for `toggle-transcript-debug` events
- Called on page load and debug mode changes

## Testing
- Use the `debug_test.html` file to test the functionality
- Open survey form and use Ctrl+D to toggle debug mode
- Verify question codes and weights appear/disappear correctly

## Benefits
1. **Clean User Interface**: Regular users see a simplified form
2. **Developer Tools**: Technical users can see detailed question information
3. **Consistent**: Uses existing debug system infrastructure
4. **Real-time**: Changes visibility immediately without page refresh
