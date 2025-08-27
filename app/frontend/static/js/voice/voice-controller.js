/**
 * Voice Controller Module
 * Main controller that orchestrates all voice functionality
 */

class VoiceController {
    constructor() {
        this.voiceCore = null;
        this.voiceParser = null;
        this.voiceUI = null;
        this.questionManager = null;
        this.voiceTTS = null;
        this.isActive = false;
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Voice Controller...');

        try {
            // Initialize all modules
            this.voiceCore = new VoiceCore();
            this.voiceParser = new VoiceParser();
            this.voiceUI = new VoiceUI();
            this.questionManager = new QuestionManager();
            this.voiceTTS = new VoiceTTS();

            // Set up debug logging
            const debugLog = (message, type) => this.voiceUI.addDebugLog(message, type);
            this.voiceParser.setDebugCallback(debugLog);
            this.questionManager.setDebugCallback(debugLog);
            this.voiceTTS.setDebugCallback(debugLog);

            // Initialize modules
            this.voiceCore.initialize();
            this.voiceUI.initialize();
            
            // Collect questions
            this.questionManager.collectQuestions();

            // Set up voice core callbacks
            this.setupVoiceCoreCallbacks();

            // Set up event handlers
            this.setupEventHandlers();

            this.isInitialized = true;
            console.log('✅ Voice Controller initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Voice Controller:', error);
            throw error;
        }
    }

    setupVoiceCoreCallbacks() {
        this.voiceCore
            .onStart(() => {
                this.voiceUI.updateStatus('🎤 Listening...', 'Speak your answer');
                if (this.voiceUI.isDebugVisible) {
                    this.voiceUI.addDebugLog('Voice recognition started');
                }
            })
            .onResult((transcript, interim) => {
                // Show interim results in debug
                if (interim) {
                    this.voiceUI.addDebugLog(`Interim: "${interim}"`, 'info');
                }

                if (transcript) {
                    console.log('🗣️ Voice input:', transcript);
                    this.voiceUI.addDebugLog(`Final: "${transcript}"`, 'voice');
                    this.voiceUI.updateStatus('Processing...', transcript);
                    this.processVoiceInput(transcript);
                }
            })
            .onError((error) => {
                this.voiceUI.addDebugLog(`Error: ${error}`, 'error');
            })
            .onEnd(() => {
                this.voiceUI.addDebugLog('Voice recognition ended');
            });
    }

    setupEventHandlers() {
        // Override the main voice button
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.removeEventListener('click', window.toggleVoiceMode);
            voiceBtn.addEventListener('click', () => this.toggleVoice());
            console.log('✅ Voice button connected to Voice Controller');
        }

        // Set up individual question voice buttons
        this.setupQuestionVoiceButtons();

        // Make global functions available
        window.stopDirectVoice = () => this.stop();
        window.voiceUI = this.voiceUI; // For debug transcript close button
    }

    setupQuestionVoiceButtons() {
        const voiceButtons = document.querySelectorAll('.voice-question-btn');

        voiceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const questionId = btn.getAttribute('data-question');
                this.startForQuestion(questionId);
            });
        });

        console.log(`🎤 Set up ${voiceButtons.length} individual voice buttons`);
    }

    toggleVoice() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.isInitialized) {
            console.error('Voice Controller not initialized');
            return;
        }

        console.log('🎤 Starting Voice Mode...');

        if (this.questionManager.getTotalCount() === 0) {
            alert('No questions found to answer');
            return;
        }

        this.isActive = true;
        this.questionManager.reset();

        // Update UI
        this.voiceUI.updateVoiceButton(true);
        this.voiceUI.showStatus();
        this.voiceUI.updateStatus('Starting voice mode...', 'Listening for answers');

        // Highlight first question
        this.highlightCurrentQuestion();

        // Start voice recognition
        try {
            this.voiceCore.start();
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.stop();
            return;
        }

        // Announce current question after a delay
        setTimeout(() => {
            if (this.isActive) {
                this.announceCurrentQuestion();
            }
        }, 1000);
    }

    stop() {
        console.log('🛑 Stopping Voice Mode...');

        this.isActive = false;
        
        // Stop voice recognition
        this.voiceCore.stop();
        
        // Stop any speech
        this.voiceTTS.stop();

        // Update UI
        this.voiceUI.updateVoiceButton(false);
        this.voiceUI.hideStatus();
        this.voiceUI.clearAllQuestionHighlights();
    }

    startForQuestion(questionId) {
        console.log(`🎯 Starting voice mode for question: ${questionId}`);

        if (!this.questionManager.setCurrentQuestionById(questionId)) {
            console.error(`❌ Question ${questionId} not found`);
            return;
        }

        // Start full voice mode but focused on this question
        this.isActive = true;

        // Update UI
        this.voiceUI.updateVoiceButton(true);
        this.voiceUI.showStatus();
        this.voiceUI.highlightQuestionButton(questionId, true);

        const question = this.questionManager.getCurrentQuestion();
        this.voiceUI.updateStatus(`🎤 Voice Mode - Question ${questionId}`, `"${question.text.substring(0, 50)}..."`);

        this.voiceUI.addDebugLog(`🎯 Starting voice mode focused on question ${questionId}`, 'info');

        // Start voice recognition
        try {
            this.voiceCore.start();
        } catch (error) {
            console.error('❌ Error starting voice recognition:', error);
            this.stop();
        }
    }

    processVoiceInput(transcript) {
        const lower = transcript.toLowerCase();
        this.voiceUI.addDebugLog(`Processing: "${transcript}" (${lower})`);

        // Check for navigation commands first
        const navCommand = this.voiceParser.isNavigationCommand(transcript);
        if (navCommand) {
            this.handleNavigationCommand(navCommand);
            return;
        }

        // Process as answer
        const currentQuestion = this.questionManager.getCurrentQuestion();
        if (!currentQuestion) {
            this.voiceUI.addDebugLog('No current question found', 'error');
            this.voiceUI.updateStatus('No Question', 'No current question found');
            return;
        }

        this.voiceUI.addDebugLog(`Current question: ${currentQuestion.id} - "${currentQuestion.text.substring(0, 30)}..."`);

        const answer = this.voiceParser.parseAnswer(transcript);
        if (answer !== null) {
            this.voiceUI.addDebugLog(`Parsed answer: "${answer}"`, 'result');
            const selectedInput = this.questionManager.selectAnswer(answer);
            
            if (selectedInput) {
                this.voiceUI.addDebugLog(`✅ Successfully selected answer: ${answer}`, 'result');
                this.voiceUI.updateStatus('✅ Answer Recorded', `Selected: ${answer}`);
                this.voiceUI.highlightSelectedAnswer(selectedInput);

                // Move to next question after a delay
                setTimeout(() => {
                    if (this.isActive) {
                        this.moveToNextQuestion();
                    }
                }, 1500);
            } else {
                this.voiceUI.addDebugLog(`❌ Failed to select answer: ${answer}`, 'error');
                this.voiceUI.updateStatus('❌ Selection Failed', 'Could not select that answer');
            }
        } else {
            this.handleUnrecognizedInput(currentQuestion);
        }
    }

    handleNavigationCommand(command) {
        this.voiceUI.addDebugLog(`Matched: ${command} command`, 'result');

        switch (command) {
            case 'next':
                this.moveToNextQuestion();
                break;
            case 'previous':
                this.moveToPreviousQuestion();
                break;
            case 'repeat':
                this.announceCurrentQuestion();
                break;
            case 'stop':
                this.stop();
                break;
        }
    }

    handleUnrecognizedInput(question) {
        this.voiceUI.addDebugLog('❓ Could not parse answer from transcript', 'error');

        const helpMessage = this.questionManager.getHelpMessage(question);
        this.voiceUI.updateStatus('❓ Didn\'t Understand', helpMessage);

        // Optionally repeat the question guidance
        setTimeout(() => {
            if (this.isActive && question) {
                this.voiceUI.addDebugLog('Providing question guidance after failed recognition', 'info');
                this.announceCurrentQuestion();
            }
        }, 2000);
    }

    moveToNextQuestion() {
        const nextQuestion = this.questionManager.moveToNext();
        if (nextQuestion) {
            this.announceCurrentQuestion();
            this.highlightCurrentQuestion();
        } else {
            this.voiceUI.updateStatus('🎉 Survey Complete!', 'All questions answered');
            setTimeout(() => this.stop(), 3000);
        }
    }

    moveToPreviousQuestion() {
        this.questionManager.moveToPrevious();
        this.announceCurrentQuestion();
        this.highlightCurrentQuestion();
    }

    highlightCurrentQuestion() {
        this.voiceUI.clearAllQuestionHighlights();
        const currentQuestion = this.questionManager.getCurrentQuestion();
        if (currentQuestion) {
            this.voiceUI.highlightQuestionButton(currentQuestion.id, true);
        }
    }

    announceCurrentQuestion() {
        const question = this.questionManager.getCurrentQuestion();
        if (!question) return;

        const questionNumber = this.questionManager.getCurrentIndex() + 1;
        const totalQuestions = this.questionManager.getTotalCount();
        const guidance = this.questionManager.getQuestionGuidance(question);

        this.voiceUI.updateStatus(
            `Question ${questionNumber} of ${totalQuestions}`,
            question.text
        );

        // Scroll to question
        question.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Announce via TTS
        this.voiceTTS.announceQuestion(question, questionNumber, totalQuestions, guidance);
    }
}

// Global instance
let voiceController = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        try {
            voiceController = new VoiceController();
            await voiceController.initialize();
            console.log('✅ Voice system ready!');
        } catch (error) {
            console.error('❌ Failed to initialize voice system:', error);
        }
    }, 1000);
});

// Export for debugging
window.VoiceController = VoiceController;
window.getVoiceController = () => voiceController;
