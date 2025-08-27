/**
 * Direct Voice Form Integration
 * Simple, working voice input for the survey form
 */

console.log('🎤 Direct Voice Form Integration Loading...');

let directVoiceRecognition = null;
let isDirectVoiceActive = false;
let currentQuestionIndex = 0;
let allQuestions = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDirectVoiceIntegration, 1000);
    
    // Connect to existing debug toggle system
    window.addEventListener('toggle-transcript-debug', function() {
        const visible = localStorage.getItem('voiceDebugVisible') === '1';
        
        if (visible) {
            showDebugTranscript();
            addDebugLog('Debug transcript enabled via header button', 'info');
        } else {
            hideDebugTranscript();
        }
    });
    
    // Initialize debug visibility from localStorage
    setTimeout(() => {
        const visible = localStorage.getItem('voiceDebugVisible') === '1';
        if (visible) {
            showDebugTranscript();
            // Add a test log to show the debug transcript is working
            setTimeout(() => {
                addDebugLog('🎉 Debug transcript ready! Click voice buttons to test.', 'info');
            }, 500);
        }
    }, 1500);
});

function initDirectVoiceIntegration() {
    console.log('🔧 Initializing Direct Voice Integration...');
    
    // Get all questions from the form
    collectFormQuestions();
    
    // Override the voice button if it exists
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.removeEventListener('click', window.toggleVoiceMode);
        voiceBtn.addEventListener('click', toggleDirectVoice);
        console.log('✅ Voice button hijacked for direct integration');
    }
    
    // Add individual question voice button handlers
    setupQuestionVoiceButtons();
    
    // Add status display
    addVoiceStatusDisplay();
    
    console.log('✅ Direct Voice Integration ready!');
}

function collectFormQuestions() {
    allQuestions = [];
    const questionCards = document.querySelectorAll('.question-card');
    
    questionCards.forEach((card, index) => {
        const questionId = card.getAttribute('data-q');
        const questionText = card.querySelector('.q-text');
        const radioInputs = card.querySelectorAll('input[type="radio"]');
        
        if (questionId && questionText && radioInputs.length > 0) {
            allQuestions.push({
                index: index,
                id: questionId,
                text: questionText.textContent.trim(),
                element: card,
                inputs: Array.from(radioInputs)
            });
        }
    });
    
    console.log(`📊 Found ${allQuestions.length} questions for voice input`);
}

function setupQuestionVoiceButtons() {
    const voiceButtons = document.querySelectorAll('.voice-question-btn');
    
    voiceButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionId = this.getAttribute('data-question');
            startVoiceForQuestion(questionId);
        });
    });
    
    console.log(`🎤 Set up ${voiceButtons.length} individual voice buttons`);
}

function startVoiceForQuestion(questionId) {
    console.log(`🎯 Starting voice mode for question: ${questionId}`);
    
    // Find the question
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) {
        console.error(`❌ Question ${questionId} not found`);
        return;
    }
    
    // Set current question index to focus on this question
    currentQuestionIndex = question.index;
    
    // Activate full voice mode but focused on this question
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Speech recognition not supported in this browser');
        return;
    }
    
    isDirectVoiceActive = true;
    
    // Update voice button state
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.textContent = 'Stop Voice';
        voiceBtn.style.background = '#e53e3e';
    }
    
    // Highlight the specific question button
    document.querySelectorAll('.voice-question-btn').forEach(btn => btn.classList.remove('active'));
    const questionBtn = document.querySelector(`.voice-question-btn[data-question="${questionId}"]`);
    if (questionBtn) {
        questionBtn.classList.add('active');
    }
    
    // Show debug transcript if debug mode is on
    const debugVisible = localStorage.getItem('voiceDebugVisible') === '1';
    if (debugVisible) {
        showDebugTranscript();
    }
    addDebugLog(`🎯 Starting voice mode focused on question ${questionId}`, 'info');
    
    // Show the voice overlay with question context
    const statusDiv = document.getElementById('directVoiceStatus');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        updateVoiceDisplay(`🎤 Voice Mode - Question ${questionId}`, `"${question.text.substring(0, 50)}..."`);
    }
    
    // Start voice recognition
    if (!directVoiceRecognition) {
        setupVoiceRecognition();
    }
    
    try {
        directVoiceRecognition.start();
        updateMainVoiceStatus(`🎤 Voice Mode - Q${questionId}`);
    } catch (error) {
        console.error('❌ Error starting voice recognition:', error);
    }
}

function stopVoiceForQuestion(questionId) {
    // Stop full voice mode
    stopDirectVoice();
    
    // Remove highlight from the question button
    const questionBtn = document.querySelector(`.voice-question-btn[data-question="${questionId}"]`);
    if (questionBtn) {
        questionBtn.classList.remove('active');
    }
    
    addDebugLog(`� Stopped voice mode for question ${questionId}`, 'info');
}

function updateMainVoiceStatus(message) {
    const voiceStatus = document.getElementById('voiceStatus');
    if (voiceStatus) {
        voiceStatus.textContent = message;
    }
}

function showDebugTranscript() {
    let debugTranscript = document.getElementById('voiceDebugTranscript');
    
    if (!debugTranscript) {
        // Create the floating debug transcript popup
        debugTranscript = document.createElement('div');
        debugTranscript.id = 'voiceDebugTranscript';
        debugTranscript.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            max-height: 300px;
            background: rgba(29, 35, 38, 0.95);
            border: 2px solid #c79a48;
            border-radius: 10px;
            padding: 15px;
            z-index: 10000;
            color: white;
            font-family: monospace;
            font-size: 0.85em;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        debugTranscript.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #c79a48;">🐛 Voice Debug Transcript</div>
                <button onclick="hideDebugTranscript()" style="background: none; border: none; color: #c79a48; cursor: pointer; font-size: 16px;">×</button>
            </div>
            <div id="debugTranscriptContent" style="max-height: 240px; overflow-y: auto; font-size: 0.8em;"></div>
        `;
        
        document.body.appendChild(debugTranscript);
        
        // Make close function global
        window.hideDebugTranscript = hideDebugTranscript;
    }
    
    debugTranscript.style.display = 'block';
}

function hideDebugTranscript() {
    const debugTranscript = document.getElementById('voiceDebugTranscript');
    if (debugTranscript) {
        debugTranscript.style.display = 'none';
    }
}

function addDebugLog(message, type = 'info') {
    const debugContent = document.getElementById('debugTranscriptContent');
    if (debugContent) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.style.marginBottom = '3px';
        
        const prefix = type === 'voice' ? '🗣️' : type === 'result' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        logEntry.innerHTML = `<span style="color: #888; font-size: 0.8em;">${timestamp}</span> ${prefix} ${message}`;
        
        debugContent.appendChild(logEntry);
        debugContent.scrollTop = debugContent.scrollHeight;
        
        // Keep only last 50 entries
        while (debugContent.children.length > 50) {
            debugContent.removeChild(debugContent.firstChild);
        }
    }
}

function addVoiceStatusDisplay() {
    // Only create overlay for full voice mode, not individual questions
    // Individual questions just use the subtle status bar at bottom
    
    // Remove existing status if present
    const existingStatus = document.getElementById('directVoiceStatus');
    if (existingStatus) existingStatus.remove();
    
    // Create a much more subtle status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'directVoiceStatus';
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(29, 35, 38, 0.9);
        border: 1px solid #c79a48;
        border-radius: 8px;
        padding: 12px 16px;
        z-index: 1000;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: none;
        backdrop-filter: blur(5px);
        max-width: 250px;
    `;
    
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span id="voiceStatusIcon" style="font-size: 16px;">🎤</span>
            <span id="voiceStatusText" style="font-size: 14px;">Voice Mode</span>
        </div>
        <div id="voiceCurrentQuestion" style="font-size: 12px; margin-top: 4px; opacity: 0.8;"></div>
        <div id="voiceTranscript" style="font-size: 11px; margin-top: 4px; opacity: 0.7; font-family: monospace;"></div>
    `;
    
    document.body.appendChild(statusDiv);
    
    // Make stop function globally available
    window.stopDirectVoice = stopDirectVoice;
}

function toggleDirectVoice() {
    if (isDirectVoiceActive) {
        stopDirectVoice();
    } else {
        startDirectVoice();
    }
}

function startDirectVoice() {
    console.log('🎤 Starting Direct Voice Mode...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Speech recognition not supported in this browser');
        return;
    }
    
    if (allQuestions.length === 0) {
        alert('No questions found to answer');
        return;
    }
    
    isDirectVoiceActive = true;
    currentQuestionIndex = 0;
    
    // Highlight the first question
    highlightCurrentQuestion();
    
    // Update button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.textContent = 'Stop Voice';
        voiceBtn.style.background = '#e53e3e';
    }
    
    // Show status display
    const statusDiv = document.getElementById('directVoiceStatus');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        updateVoiceDisplay('Starting voice mode...', 'Listening for answers');
    }
    
    // Start recognition
    startDirectRecognition();
    
    // Announce current question
    setTimeout(() => {
        if (isDirectVoiceActive) {
            announceCurrentQuestion();
        }
    }, 1000);
}

function stopDirectVoice() {
    console.log('🛑 Stopping Direct Voice Mode...');
    
    isDirectVoiceActive = false;
    
    if (directVoiceRecognition) {
        try {
            directVoiceRecognition.stop();
        } catch (e) {
            console.warn('Error stopping recognition:', e);
        }
        directVoiceRecognition = null;
    }
    
    // Update button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.textContent = 'Voice Mode';
        voiceBtn.style.background = '';
    }
    
    // Clear all question highlights
    document.querySelectorAll('.voice-question-btn').forEach(btn => btn.classList.remove('active'));
    
    // Hide status display
    const statusDiv = document.getElementById('directVoiceStatus');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

function startDirectRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (directVoiceRecognition) {
        try {
            directVoiceRecognition.stop();
        } catch (e) {}
    }
    
    directVoiceRecognition = new SpeechRecognition();
    directVoiceRecognition.continuous = true;
    directVoiceRecognition.interimResults = true;
    directVoiceRecognition.lang = 'en-US';
    
    directVoiceRecognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        updateVoiceDisplay('🎤 Listening...', 'Speak your answer');
        showDebugTranscript();
        addDebugLog('Voice recognition started');
    };
    
    directVoiceRecognition.onresult = (event) => {
        let transcript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript = event.results[i][0].transcript.trim();
                break;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Show interim results in debug
        if (interimTranscript) {
            addDebugLog(`Interim: "${interimTranscript}"`, 'info');
        }
        
        if (transcript) {
            console.log('🗣️ Voice input:', transcript);
            addDebugLog(`Final: "${transcript}"`, 'voice');
            updateVoiceDisplay('Processing...', transcript);
            processDirectVoiceInput(transcript);
        }
    };
    
    directVoiceRecognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        addDebugLog(`Error: ${event.error}`, 'error');
        if (event.error !== 'aborted' && isDirectVoiceActive) {
            setTimeout(() => {
                if (isDirectVoiceActive) {
                    startDirectRecognition();
                }
            }, 1000);
        }
    };
    
    directVoiceRecognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        addDebugLog('Voice recognition ended');
        if (isDirectVoiceActive) {
            setTimeout(() => {
                if (isDirectVoiceActive) {
                    startDirectRecognition();
                }
            }, 500);
        }
    };
    
    try {
        directVoiceRecognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        updateVoiceDisplay('Error', 'Failed to start voice recognition');
    }
}

function processDirectVoiceInput(transcript) {
    const lower = transcript.toLowerCase();
    addDebugLog(`Processing: "${transcript}" (${lower})`);
    
    // Check for navigation commands
    if (lower.includes('next') || lower.includes('skip')) {
        addDebugLog('Matched: Next/Skip command', 'result');
        moveToNextQuestion();
        return;
    }
    
    if (lower.includes('previous') || lower.includes('back')) {
        addDebugLog('Matched: Previous/Back command', 'result');
        moveToPreviousQuestion();
        return;
    }
    
    if (lower.includes('repeat') || lower.includes('again')) {
        addDebugLog('Matched: Repeat command', 'result');
        announceCurrentQuestion();
        return;
    }
    
    if (lower.includes('stop') || lower.includes('exit')) {
        addDebugLog('Matched: Stop/Exit command', 'result');
        stopDirectVoice();
        return;
    }
    
    // Process as answer
    const currentQuestion = allQuestions[currentQuestionIndex];
    if (!currentQuestion) {
        addDebugLog('No current question found', 'error');
        updateVoiceDisplay('No Question', 'No current question found');
        return;
    }
    
    addDebugLog(`Current question: ${currentQuestion.id} - "${currentQuestion.text.substring(0, 30)}..."`);
    
    const answer = parseDirectAnswer(transcript);
    if (answer !== null) {
        addDebugLog(`Parsed answer: "${answer}"`, 'result');
        if (selectAnswer(currentQuestion, answer)) {
            addDebugLog(`✅ Successfully selected answer: ${answer}`, 'result');
            updateVoiceDisplay('✅ Answer Recorded', `Selected: ${answer}`);
            
            // Move to next question after a delay
            setTimeout(() => {
                if (isDirectVoiceActive) {
                    moveToNextQuestion();
                }
            }, 1500);
        } else {
            addDebugLog(`❌ Failed to select answer: ${answer}`, 'error');
            updateVoiceDisplay('❌ Selection Failed', 'Could not select that answer');
        }
    } else {
        addDebugLog('❓ Could not parse answer from transcript', 'error');
        updateVoiceDisplay('❓ Didn\'t Understand', 'Try: numbers 1-5, yes, no, or navigation commands');
    }
}

function parseDirectAnswer(transcript) {
    const lower = transcript.toLowerCase();
    addDebugLog(`Parsing answer from: "${lower}"`);
    
    // Check for numbers 1-5
    const numberMatch = lower.match(/\b([1-5])\b/);
    if (numberMatch) {
        addDebugLog(`Found number: ${numberMatch[1]}`);
        return numberMatch[1];
    }
    
    // Check for yes/no
    if (/\b(yes|yeah|yep)\b/i.test(lower)) {
        addDebugLog('Found: yes');
        return 'yes';
    }
    
    if (/\b(no|nope)\b/i.test(lower)) {
        addDebugLog('Found: no');
        return 'no';
    }
    
    // Check for word numbers
    const wordNumbers = {
        'one': '1',
        'two': '2', 
        'three': '3',
        'four': '4',
        'five': '5'
    };
    
    for (const [word, number] of Object.entries(wordNumbers)) {
        if (lower.includes(word)) {
            return number;
        }
    }
    
    return null;
}

function selectAnswer(question, answer) {
    console.log(`🎯 Selecting answer "${answer}" for question ${question.id}`);
    
    // For yes/no, try to map to appropriate values
    if (answer === 'yes') {
        // Look for value "1" first, then "5"
        let input = question.inputs.find(inp => inp.value === '1');
        if (!input) input = question.inputs.find(inp => inp.value === '5');
        if (input) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            highlightSelectedAnswer(input);
            return true;
        }
    }
    
    if (answer === 'no') {
        // Look for value "0" first, then "1"
        let input = question.inputs.find(inp => inp.value === '0');
        if (!input) input = question.inputs.find(inp => inp.value === '1');
        if (input) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            highlightSelectedAnswer(input);
            return true;
        }
    }
    
    // For numbers, find exact match
    const input = question.inputs.find(inp => inp.value === answer);
    if (input) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        highlightSelectedAnswer(input);
        return true;
    }
    
    return false;
}

function highlightSelectedAnswer(input) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
        // Remove highlights from siblings
        const allLabels = document.querySelectorAll(`label[for^="${input.name}_"]`);
        allLabels.forEach(l => {
            l.style.background = '';
            l.style.color = '';
        });
        
        // Highlight selected
        label.style.background = '#38a169';
        label.style.color = 'white';
        label.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function moveToNextQuestion() {
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        announceCurrentQuestion();
        highlightCurrentQuestion();
    } else {
        updateVoiceDisplay('🎉 Survey Complete!', 'All questions answered');
        setTimeout(() => stopDirectVoice(), 3000);
    }
}

function moveToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        announceCurrentQuestion();
        highlightCurrentQuestion();
    }
}

function highlightCurrentQuestion() {
    // Remove all highlights
    document.querySelectorAll('.voice-question-btn').forEach(btn => btn.classList.remove('active'));
    
    // Highlight current question
    const currentQuestion = allQuestions[currentQuestionIndex];
    if (currentQuestion) {
        const questionBtn = document.querySelector(`.voice-question-btn[data-question="${currentQuestion.id}"]`);
        if (questionBtn) {
            questionBtn.classList.add('active');
            // Scroll into view
            questionBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function announceCurrentQuestion() {
    const question = allQuestions[currentQuestionIndex];
    if (!question) return;
    
    const questionText = question.text;
    const questionNumber = currentQuestionIndex + 1;
    const totalQuestions = allQuestions.length;
    
    updateVoiceDisplay(
        `Question ${questionNumber} of ${totalQuestions}`,
        questionText
    );
    
    // Scroll to question
    question.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Speak the question if speech synthesis is available
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Question ${questionNumber}. ${questionText}. Say a number from 1 to 5, or yes or no.`);
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
    }
}

function updateVoiceDisplay(status, details) {
    const statusText = document.getElementById('voiceStatusText');
    const currentQuestion = document.getElementById('voiceCurrentQuestion');
    const transcript = document.getElementById('voiceTranscript');
    
    if (statusText) statusText.textContent = status;
    if (currentQuestion) currentQuestion.textContent = details || '';
    if (transcript && details !== undefined) {
        transcript.textContent = details;
    }
}

console.log('✅ Direct Voice Form Integration loaded');

// Export for debugging
window.DirectVoiceIntegration = {
    start: startDirectVoice,
    stop: stopDirectVoice,
    toggle: toggleDirectVoice,
    questions: () => allQuestions
};
