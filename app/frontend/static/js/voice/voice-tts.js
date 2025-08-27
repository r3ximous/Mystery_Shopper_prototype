/**
 * Voice TTS Module
 * Handles text-to-speech functionality for question announcements
 */

class VoiceTTS {
    constructor() {
        this.isEnabled = true;
        this.rate = 1.0;
        this.debugCallback = null;
    }

    setDebugCallback(callback) {
        this.debugCallback = callback;
        return this;
    }

    log(message, type = 'info') {
        if (this.debugCallback) {
            this.debugCallback(message, type);
        }
    }

    isAvailable() {
        return 'speechSynthesis' in window;
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        return this;
    }

    setRate(rate) {
        this.rate = rate;
        return this;
    }

    announceQuestion(question, questionNumber, totalQuestions, guidance) {
        if (!this.isEnabled || !this.isAvailable() || !question) {
            return;
        }

        const questionText = question.text;
        const voiceGuidance = guidance || `Say a number from 1 to ${question.inputs.length} for your choice.`;

        const utteranceText = `Question ${questionNumber}. ${questionText}. ${voiceGuidance}`;
        
        this.log(`Speaking: Question ${questionNumber} with ${question.inputs.length} options`, 'info');
        
        this.speak(utteranceText);
    }

    speak(text) {
        if (!this.isAvailable() || !this.isEnabled) {
            return;
        }

        try {
            // Stop any ongoing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = this.rate;
            speechSynthesis.speak(utterance);
        } catch (error) {
            this.log(`TTS Error: ${error.message}`, 'error');
        }
    }

    stop() {
        if (this.isAvailable()) {
            speechSynthesis.cancel();
        }
    }

    announceStatus(message) {
        if (this.isEnabled) {
            this.speak(message);
        }
    }
}

// Export for use by other modules
window.VoiceTTS = VoiceTTS;
