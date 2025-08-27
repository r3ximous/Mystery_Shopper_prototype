/**
 * Simple Voice Recognition Test
 * Direct implementation without module dependencies
 */

console.log('🎤 Simple Voice Test Loading...');

let simpleRecognition = null;
let isListening = false;

function createSimpleVoiceTest() {
    // Check if already created
    if (document.getElementById('simpleVoiceTest')) return;
    
    const testPanel = document.createElement('div');
    testPanel.id = 'simpleVoiceTest';
    testPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 300px;
        background: #2d3748;
        border: 2px solid #4299e1;
        border-radius: 10px;
        padding: 15px;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    
    testPanel.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #4299e1;">🎤 Simple Voice Test</h4>
        <button id="startSimpleVoice" style="width: 100%; padding: 8px; margin: 5px 0; background: #4299e1; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Start Listening
        </button>
        <button id="stopSimpleVoice" style="width: 100%; padding: 8px; margin: 5px 0; background: #e53e3e; color: white; border: none; border-radius: 5px; cursor: pointer;" disabled>
            Stop Listening
        </button>
        <div id="simpleTranscript" style="background: #1a202c; padding: 8px; margin: 10px 0; border-radius: 5px; min-height: 40px; border: 1px solid #4299e1; font-size: 12px;">
            Say something...
        </div>
        <button id="testNumber" style="width: 100%; padding: 8px; margin: 5px 0; background: #38a169; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Test "Number 3" → Form
        </button>
        <button id="closeSimpleTest" style="position: absolute; top: 5px; right: 10px; background: none; border: none; color: #4299e1; font-size: 16px; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(testPanel);
    
    // Event listeners
    document.getElementById('closeSimpleTest').onclick = () => testPanel.remove();
    document.getElementById('startSimpleVoice').onclick = startSimpleListening;
    document.getElementById('stopSimpleVoice').onclick = stopSimpleListening;
    document.getElementById('testNumber').onclick = testNumberInput;
    
    console.log('✅ Simple Voice Test Panel created');
}

function startSimpleListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        document.getElementById('simpleTranscript').textContent = 'Speech recognition not supported';
        return;
    }
    
    if (simpleRecognition) {
        simpleRecognition.stop();
    }
    
    simpleRecognition = new SpeechRecognition();
    simpleRecognition.continuous = true;
    simpleRecognition.interimResults = true;
    simpleRecognition.lang = 'en-US';
    
    simpleRecognition.onstart = () => {
        isListening = true;
        document.getElementById('startSimpleVoice').disabled = true;
        document.getElementById('stopSimpleVoice').disabled = false;
        document.getElementById('simpleTranscript').textContent = 'Listening... Speak now!';
        document.getElementById('simpleTranscript').style.borderColor = '#38a169';
        console.log('🎤 Simple voice recognition started');
    };
    
    simpleRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        document.getElementById('simpleTranscript').innerHTML = `
            <div style="color: #4299e1;">Heard: "${transcript}"</div>
            ${processSimpleVoiceInput(transcript)}
        `;
    };
    
    simpleRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('simpleTranscript').textContent = `Error: ${event.error}`;
        document.getElementById('simpleTranscript').style.borderColor = '#e53e3e';
        resetSimpleVoiceButtons();
    };
    
    simpleRecognition.onend = () => {
        console.log('🎤 Simple voice recognition ended');
        resetSimpleVoiceButtons();
    };
    
    try {
        simpleRecognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        document.getElementById('simpleTranscript').textContent = `Failed to start: ${error.message}`;
        resetSimpleVoiceButtons();
    }
}

function stopSimpleListening() {
    if (simpleRecognition) {
        simpleRecognition.stop();
    }
    resetSimpleVoiceButtons();
}

function resetSimpleVoiceButtons() {
    isListening = false;
    document.getElementById('startSimpleVoice').disabled = false;
    document.getElementById('stopSimpleVoice').disabled = true;
    document.getElementById('simpleTranscript').style.borderColor = '#4299e1';
}

function processSimpleVoiceInput(transcript) {
    const lower = transcript.toLowerCase();
    let result = '<div style="margin-top: 10px;">';
    
    // Check for numbers
    const numberMatch = lower.match(/\b([1-5])\b/);
    if (numberMatch) {
        const number = numberMatch[1];
        result += `<div style="color: #38a169;">✅ Detected number: ${number}</div>`;
        
        // Try to find and select corresponding radio button
        const radioInputs = document.querySelectorAll(`input[type="radio"][value="${number}"]`);
        if (radioInputs.length > 0) {
            const firstRadio = radioInputs[0];
            firstRadio.checked = true;
            firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Visual feedback
            const label = document.querySelector(`label[for="${firstRadio.id}"]`);
            if (label) {
                label.style.background = '#38a169';
                label.style.color = 'white';
                setTimeout(() => {
                    label.style.background = '';
                    label.style.color = '';
                }, 3000);
            }
            
            result += `<div style="color: #38a169;">🎯 Selected radio button with value "${number}"</div>`;
        } else {
            result += `<div style="color: #e53e3e;">❌ No radio button found with value "${number}"</div>`;
        }
    }
    
    // Check for yes/no
    if (/\b(yes|yeah|yep)\b/i.test(lower)) {
        result += `<div style="color: #38a169;">✅ Detected: YES</div>`;
        selectRadioByValue(['1', '5']); // Try common yes values
    }
    
    if (/\b(no|nope)\b/i.test(lower)) {
        result += `<div style="color: #38a169;">✅ Detected: NO</div>`;
        selectRadioByValue(['0', '1']); // Try common no values
    }
    
    result += '</div>';
    return result;
}

function selectRadioByValue(values) {
    for (const value of values) {
        const radioInputs = document.querySelectorAll(`input[type="radio"][value="${value}"]`);
        if (radioInputs.length > 0) {
            const firstRadio = radioInputs[0];
            firstRadio.checked = true;
            firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    }
    return false;
}

function testNumberInput() {
    // Simulate saying "3"
    const transcript = "three 3";
    document.getElementById('simpleTranscript').innerHTML = `
        <div style="color: #4299e1;">Test Input: "${transcript}"</div>
        ${processSimpleVoiceInput(transcript)}
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        createSimpleVoiceTest();
        console.log('🎤 Simple Voice Test ready!');
    }, 2000);
});

// Global access
window.SimpleVoiceTest = {
    create: createSimpleVoiceTest,
    start: startSimpleListening,
    stop: stopSimpleListening
};
