/**
 * Voice UI Module
 * Handles voice interface elements and visual feedback
 */

class VoiceUI {
    constructor() {
        this.statusDiv = null;
        this.debugTranscript = null;
        this.isDebugVisible = false;
    }

    initialize() {
        this.createStatusDisplay();
        this.setupDebugTranscript();
        this.restoreDebugVisibility();
        return this;
    }

    createStatusDisplay() {
        // Remove existing status if present
        const existingStatus = document.getElementById('directVoiceStatus');
        if (existingStatus) existingStatus.remove();

        // Create a subtle status indicator
        this.statusDiv = document.createElement('div');
        this.statusDiv.id = 'directVoiceStatus';
        this.statusDiv.style.cssText = `
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

        this.statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span id="voiceStatusIcon" style="font-size: 16px;">🎤</span>
                <span id="voiceStatusText" style="font-size: 14px;">Voice Mode</span>
            </div>
            <div id="voiceCurrentQuestion" style="font-size: 12px; margin-top: 4px; opacity: 0.8;"></div>
            <div id="voiceTranscript" style="font-size: 11px; margin-top: 4px; opacity: 0.7; font-family: monospace;"></div>
        `;

        document.body.appendChild(this.statusDiv);
    }

    setupDebugTranscript() {
        // Connect to existing debug toggle system
        window.addEventListener('toggle-transcript-debug', () => {
            const visible = localStorage.getItem('voiceDebugVisible') === '1';
            
            if (visible) {
                this.showDebugTranscript();
                this.addDebugLog('Debug transcript enabled via header button', 'info');
            } else {
                this.hideDebugTranscript();
            }
        });
    }

    restoreDebugVisibility() {
        setTimeout(() => {
            const visible = localStorage.getItem('voiceDebugVisible') === '1';
            if (visible) {
                this.showDebugTranscript();
                setTimeout(() => {
                    this.addDebugLog('🎉 Debug transcript ready! Click voice buttons to test.', 'info');
                }, 500);
            }
        }, 1500);
    }

    showStatus() {
        if (this.statusDiv) {
            this.statusDiv.style.display = 'block';
        }
    }

    hideStatus() {
        if (this.statusDiv) {
            this.statusDiv.style.display = 'none';
        }
    }

    updateStatus(status, details) {
        const statusText = document.getElementById('voiceStatusText');
        const currentQuestion = document.getElementById('voiceCurrentQuestion');
        const transcript = document.getElementById('voiceTranscript');

        if (statusText) statusText.textContent = status;
        if (currentQuestion) currentQuestion.textContent = details || '';
        if (transcript && details !== undefined) {
            transcript.textContent = details;
        }
    }

    showDebugTranscript() {
        if (!this.debugTranscript) {
            this.createDebugTranscript();
        }
        this.debugTranscript.style.display = 'block';
        this.isDebugVisible = true;
    }

    hideDebugTranscript() {
        if (this.debugTranscript) {
            this.debugTranscript.style.display = 'none';
        }
        this.isDebugVisible = false;
    }

    createDebugTranscript() {
        this.debugTranscript = document.createElement('div');
        this.debugTranscript.id = 'voiceDebugTranscript';
        this.debugTranscript.style.cssText = `
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

        this.debugTranscript.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #c79a48;">🐛 Voice Debug Transcript</div>
                <button onclick="voiceUI.hideDebugTranscript()" style="background: none; border: none; color: #c79a48; cursor: pointer; font-size: 16px;">×</button>
            </div>
            <div id="debugTranscriptContent" style="max-height: 240px; overflow-y: auto; font-size: 0.8em;"></div>
        `;

        document.body.appendChild(this.debugTranscript);
    }

    addDebugLog(message, type = 'info') {
        if (!this.isDebugVisible) return;

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

    highlightQuestionButton(questionId, active = true) {
        const questionBtn = document.querySelector(`.voice-question-btn[data-question="${questionId}"]`);
        if (questionBtn) {
            if (active) {
                questionBtn.classList.add('active');
                questionBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                questionBtn.classList.remove('active');
            }
        }
    }

    clearAllQuestionHighlights() {
        document.querySelectorAll('.voice-question-btn').forEach(btn => btn.classList.remove('active'));
    }

    highlightSelectedAnswer(input) {
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

    updateVoiceButton(isActive) {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            if (isActive) {
                voiceBtn.textContent = 'Stop Voice';
                voiceBtn.style.background = '#e53e3e';
            } else {
                voiceBtn.textContent = 'Voice Mode';
                voiceBtn.style.background = '';
            }
        }
    }
}

// Export for use by other modules
window.VoiceUI = VoiceUI;
