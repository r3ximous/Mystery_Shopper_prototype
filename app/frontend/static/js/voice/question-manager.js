/**
 * Question Manager Module
 * Handles question collection, navigation, and answer selection
 */

class QuestionManager {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
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

    collectQuestions() {
        this.questions = [];
        const questionCards = document.querySelectorAll('.question-card');

        questionCards.forEach((card, index) => {
            const questionId = card.getAttribute('data-q');
            const questionText = card.querySelector('.q-text');
            const radioInputs = card.querySelectorAll('input[type="radio"]');

            if (questionId && questionText && radioInputs.length > 0) {
                this.questions.push({
                    index: index,
                    id: questionId,
                    text: questionText.textContent.trim(),
                    element: card,
                    inputs: Array.from(radioInputs)
                });
            }
        });

        console.log(`📊 Found ${this.questions.length} questions for voice input`);
        return this.questions.length;
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex] || null;
    }

    findQuestionById(questionId) {
        return this.questions.find(q => q.id === questionId) || null;
    }

    setCurrentQuestionById(questionId) {
        const question = this.findQuestionById(questionId);
        if (question) {
            this.currentIndex = question.index;
            return true;
        }
        return false;
    }

    moveToNext() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return this.getCurrentQuestion();
        }
        return null; // End of survey
    }

    moveToPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.getCurrentQuestion();
        }
        return this.getCurrentQuestion();
    }

    selectAnswer(answer) {
        const question = this.getCurrentQuestion();
        if (!question) {
            this.log('No current question found', 'error');
            return false;
        }

        this.log(`Selecting answer "${answer}" for question ${question.id}`);

        // For yes/no, try to map to appropriate values
        if (answer === 'yes') {
            // Look for value "1" first, then "5"
            let input = question.inputs.find(inp => inp.value === '1');
            if (!input) input = question.inputs.find(inp => inp.value === '5');
            if (input) {
                return this.activateInput(input);
            }
        }

        if (answer === 'no') {
            // Look for value "0" first, then "1"
            let input = question.inputs.find(inp => inp.value === '0');
            if (!input) input = question.inputs.find(inp => inp.value === '1');
            if (input) {
                return this.activateInput(input);
            }
        }

        // For numbers, map to the display order (1st, 2nd, 3rd option) rather than scoring values
        if (/^\d+$/.test(answer)) {
            const optionIndex = parseInt(answer) - 1; // Convert 1-based to 0-based index

            if (optionIndex >= 0 && optionIndex < question.inputs.length) {
                // Get the input at the specified display position
                const input = question.inputs[optionIndex];

                if (input) {
                    this.log(`Mapping spoken "${answer}" to option ${optionIndex + 1} (value="${input.value}")`, 'info');
                    return this.activateInput(input);
                }
            } else {
                this.log(`Invalid option number: ${answer}. Question has ${question.inputs.length} options.`, 'error');
            }
        }

        // Fallback: try exact value match (legacy behavior)
        const input = question.inputs.find(inp => inp.value === answer);
        if (input) {
            this.log(`Fallback: Exact value match for "${answer}"`, 'info');
            return this.activateInput(input);
        }

        this.log(`No matching option found for "${answer}"`, 'error');
        return false;
    }

    activateInput(input) {
        try {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return input; // Return the input for UI highlighting
        } catch (error) {
            this.log(`Error activating input: ${error.message}`, 'error');
            return false;
        }
    }

    getQuestionGuidance(question) {
        if (!question) return 'Say a number from 1 to 5.';

        // Check if it's a yes/no question (has exactly 2 options)
        if (question.inputs.length === 2) {
            return 'Say yes or no.';
        } 
        // Check if it's a multiple choice question (more than 2 options)
        else if (question.inputs.length > 2) {
            return `Say a number from 1 to ${question.inputs.length} for your choice.`;
        }
        // Default for rating questions
        else {
            return 'Say a number from 1 to 5.';
        }
    }

    getHelpMessage(question) {
        if (!question) {
            return 'Try: navigation commands (next, previous, repeat, stop)';
        }

        if (question.inputs.length === 2) {
            return 'Try: yes, no, 1, 2, or navigation commands';
        } else if (question.inputs.length > 2) {
            return `Try: numbers 1-${question.inputs.length}, or navigation commands`;
        } else {
            return 'Try: numbers 1-5, or navigation commands';
        }
    }

    reset() {
        this.currentIndex = 0;
    }

    getAllQuestions() {
        return this.questions;
    }

    getTotalCount() {
        return this.questions.length;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    isLastQuestion() {
        return this.currentIndex >= this.questions.length - 1;
    }

    isFirstQuestion() {
        return this.currentIndex <= 0;
    }
}

// Export for use by other modules
window.QuestionManager = QuestionManager;
