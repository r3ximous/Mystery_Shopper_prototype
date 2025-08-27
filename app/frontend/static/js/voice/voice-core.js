/**
 * Voice Core Module
 * Handles speech recognition initialization and core functionality
 */

class VoiceCore {
    constructor() {
        this.recognition = null;
        this.isActive = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
    }

    initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            throw new Error('Speech recognition not supported in this browser');
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupEventHandlers();
        return this;
    }

    setupEventHandlers() {
        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isActive = true;
            if (this.onStartCallback) this.onStartCallback();
        };

        this.recognition.onresult = (event) => {
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

            if (this.onResultCallback) {
                this.onResultCallback(transcript, interimTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (this.onErrorCallback) this.onErrorCallback(event.error);
            
            if (event.error !== 'aborted' && this.isActive) {
                setTimeout(() => {
                    if (this.isActive) {
                        this.start();
                    }
                }, 1000);
            }
        };

        this.recognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            if (this.onEndCallback) this.onEndCallback();
            
            if (this.isActive) {
                setTimeout(() => {
                    if (this.isActive) {
                        this.start();
                    }
                }, 500);
            }
        };
    }

    start() {
        if (!this.recognition) {
            throw new Error('Voice recognition not initialized');
        }

        try {
            this.recognition.start();
            this.isActive = true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            throw error;
        }
    }

    stop() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('Error stopping recognition:', e);
            }
        }
        this.isActive = false;
    }

    onResult(callback) {
        this.onResultCallback = callback;
        return this;
    }

    onError(callback) {
        this.onErrorCallback = callback;
        return this;
    }

    onStart(callback) {
        this.onStartCallback = callback;
        return this;
    }

    onEnd(callback) {
        this.onEndCallback = callback;
        return this;
    }
}

// Export for use by other modules
window.VoiceCore = VoiceCore;
