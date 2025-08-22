/**
 * Debug script to investigate voice mode form submission issue
 * Run this in browser console when voice mode is active
 */

// Check if voice mode is actually interfering with form submission
function debugVoiceSubmission() {
    console.log('=== Voice Mode Debug ===');
    
    // Check voice button state
    const voiceBtn = document.getElementById('voiceBtn');
    console.log('Voice Button Mode:', voiceBtn?.dataset?.mode);
    console.log('Voice Button Text:', voiceBtn?.textContent);
    
    // Check if voice recognition is active
    console.log('Window state:', window.state);
    
    // Check form element
    const form = document.getElementById('surveyForm');
    console.log('Form exists:', !!form);
    console.log('Form event listeners:', getEventListeners ? getEventListeners(form) : 'getEventListeners not available');
    
    // Check submit button
    const submitBtn = form?.querySelector('button[type="submit"]');
    console.log('Submit button exists:', !!submitBtn);
    console.log('Submit button disabled:', submitBtn?.disabled);
    
    // Test form submission programmatically
    if (form) {
        console.log('Testing form submission...');
        try {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            const dispatched = form.dispatchEvent(event);
            console.log('Form submit event dispatched:', dispatched);
        } catch (e) {
            console.error('Error dispatching submit event:', e);
        }
    }
    
    // Check for any global event listeners that might interfere
    console.log('Document event listeners:', getEventListeners ? getEventListeners(document) : 'getEventListeners not available');
    console.log('Window event listeners:', getEventListeners ? getEventListeners(window) : 'getEventListeners not available');
}

// Check speech recognition state
function debugSpeechRecognition() {
    console.log('=== Speech Recognition Debug ===');
    
    // Check if speech recognition is running
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        console.log('SpeechRecognition API available');
    } else {
        console.log('SpeechRecognition API NOT available');
    }
    
    // Check recognition instance (if exposed)
    if (window.recog) {
        console.log('Recognition instance exists');
        console.log('Recognition continuous:', window.recog.continuous);
        console.log('Recognition lang:', window.recog.lang);
    } else {
        console.log('No global recognition instance found');
    }
}

// Run all diagnostics
debugVoiceSubmission();
debugSpeechRecognition();

// Create a manual form submission test
function testManualSubmit() {
    const form = document.getElementById('surveyForm');
    if (!form) {
        console.error('Form not found!');
        return;
    }
    
    // Fill in some test data first
    const radios = form.querySelectorAll('input[type="radio"][value="3"]');
    radios.forEach(radio => radio.checked = true);
    
    // Create form data
    const formData = new FormData(form);
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    // Try to submit manually
    console.log('Attempting manual submission...');
    const submitEvent = new SubmitEvent('submit', { 
        bubbles: true, 
        cancelable: true,
        submitter: form.querySelector('button[type="submit"]')
    });
    
    const result = form.dispatchEvent(submitEvent);
    console.log('Manual submit result:', result);
}

// Export for manual testing
window.debugVoiceSubmission = debugVoiceSubmission;
window.debugSpeechRecognition = debugSpeechRecognition;
window.testManualSubmit = testManualSubmit;

console.log('Debug functions loaded. You can run:');
console.log('- debugVoiceSubmission()');
console.log('- debugSpeechRecognition()');
console.log('- testManualSubmit()');
