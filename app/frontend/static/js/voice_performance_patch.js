/**
 * Voice Performance Optimization Patch
 * Replaces slow functions in survey_enhanced_flow.js with faster versions
 */

(function() {
    'use strict';
    
    console.log('Loading voice performance optimizations...');
    
    // Wait for DOM and other scripts to load
    document.addEventListener('DOMContentLoaded', function() {
        // Small delay to ensure survey_enhanced_flow.js is loaded
        setTimeout(function() {
            applyOptimizations();
        }, 200);
    });
    
    function applyOptimizations() {
        // Check if enhanced flow is available
        if (typeof window.parseAnswer === 'function' && 
            typeof window.handleVoiceResult === 'function') {
            
            console.log('Applying voice performance patches...');
            
            // Replace slow parsing functions
            window.parseScore = parseScoreOptimized;
            window.parseAnswer = parseAnswerOptimized;
            window.handleVoiceResult = handleVoiceResultOptimized;
            window.recordAnswer = recordAnswerOptimized;
            window.askCurrentQuestion = askCurrentQuestionOptimized;
            
            // Initialize form cache
            updateFormElementCache();
            
            console.log('Voice performance optimizations applied successfully');
            
            // Show optimization status in UI if there's a status element
            const statusElement = document.getElementById('voiceStatus');
            if (statusElement) {
                const originalText = statusElement.textContent;
                statusElement.textContent = originalText + ' (Optimized)';
            }
            
        } else {
            console.warn('Enhanced voice flow not found, retrying...');
            // Retry after a short delay
            setTimeout(applyOptimizations, 500);
        }
    }
    
    // Performance optimized parsing functions
    function parseScoreOptimized(text) {
        const lower = text.toLowerCase();
        
        // Quick numeric check first (most common case)
        const numMatch = lower.match(/\b([1-5])\b/);
        if (numMatch) {
            return parseInt(numMatch[1]);
        }
        
        // Fast qualitative mapping (reduced set for performance)
        const quickScoreMap = {
            // English (most common first)
            'excellent': 5, 'perfect': 5, 'five': 5,
            'good': 4, 'great': 4, 'four': 4,
            'okay': 3, 'average': 3, 'three': 3,
            'bad': 2, 'poor': 2, 'two': 2,
            'terrible': 1, 'awful': 1, 'one': 1,
            
            // Arabic (essential terms only)
            'ممتاز': 5, 'خمسة': 5,
            'جيد': 4, 'اربعة': 4,
            'عادي': 3, 'ثلاثة': 3,
            'سيئ': 2, 'اتنين': 2,
            'فظيع': 1, 'واحد': 1
        };
        
        // Single pass through the map
        for (const [word, score] of Object.entries(quickScoreMap)) {
            if (lower.includes(word)) {
                return score;
            }
        }
        
        return null;
    }
    
    function parseAnswerOptimized(transcript, questionType) {
        const lower = transcript.toLowerCase();
        
        switch (questionType) {
            case 'rating':
                return parseScoreOptimized(lower);
                
            case 'yes_no':
                // Fast yes/no detection with regex
                if (/\b(yes|yeah|yep|نعم|اه|ايوه)\b/i.test(lower)) return 'yes';
                if (/\b(no|nope|لا|مش)\b/i.test(lower)) return 'no';
                return null;
                
            case 'multiple_choice':
                // Try numeric first, then fallback
                const score = parseScoreOptimized(lower);
                if (score) return score;
                
                // Simplified option matching if needed
                if (typeof window.state !== 'undefined' && window.QUESTIONS) {
                    const currentQuestion = window.QUESTIONS[window.state.currentQuestion];
                    if (currentQuestion?.options) {
                        for (let i = 0; i < currentQuestion.options.length; i++) {
                            const option = currentQuestion.options[i];
                            const optionText = (option.en || option.ar || '').toLowerCase();
                            if (optionText && lower.includes(optionText.substring(0, 8))) {
                                return (i + 1).toString();
                            }
                        }
                    }
                }
                return null;
                
            default:
                return parseScoreOptimized(lower);
        }
    }
    
    // Optimized form element caching
    const formElementCache = new Map();
    let lastCacheUpdate = 0;
    const CACHE_REFRESH_INTERVAL = 5000;
    
    function updateFormElementCache() {
        const now = Date.now();
        if (now - lastCacheUpdate < CACHE_REFRESH_INTERVAL && formElementCache.size > 0) {
            return;
        }
        
        formElementCache.clear();
        
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            const questionId = input.name;
            if (!formElementCache.has(questionId)) {
                formElementCache.set(questionId, new Map());
            }
            formElementCache.get(questionId).set(input.value, {
                input: input,
                label: document.querySelector(`label[for="${input.id}"]`)
            });
        });
        
        lastCacheUpdate = now;
    }
    
    function recordAnswerOptimized(answer, questionType) {
        // Use the existing getCurrentQuestion function if available
        const question = typeof window.getCurrentQuestion === 'function' ? 
                        window.getCurrentQuestion() : null;
        if (!question) return false;
        
        updateFormElementCache();
        
        const questionId = question.id;
        let inputValue = answer;
        
        // Quick yes/no conversion
        if (questionType === 'yes_no') {
            if (answer === 'yes') {
                inputValue = formElementCache.get(questionId)?.has('5') ? '5' : '1';
            } else if (answer === 'no') {
                inputValue = formElementCache.get(questionId)?.has('1') ? '1' : '0';
            }
        }
        
        // Fast form update using cache
        const questionCache = formElementCache.get(questionId);
        if (questionCache?.has(inputValue)) {
            const element = questionCache.get(inputValue);
            
            if (element.input) {
                element.input.checked = true;
                
                // Quick visual feedback
                if (element.label) {
                    questionCache.forEach(sibling => {
                        if (sibling.label) sibling.label.classList.remove('selected');
                    });
                    element.label.classList.add('selected');
                }
                
                // Trigger change event
                element.input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Record latency if voiceState is available
                if (typeof window.voiceState !== 'undefined' && window.voiceState.questionStartTime) {
                    const responseTime = performance.now() - window.voiceState.questionStartTime;
                    window.voiceState.latencySamples = window.voiceState.latencySamples || [];
                    window.voiceState.latencySamples.push({
                        question_id: questionId,
                        qId: questionId,
                        latencyMs: Math.round(responseTime)
                    });
                }
                
                return true;
            }
        }
        
        // Fallback to original method if cache fails
        if (typeof window.recordAnswerOriginal === 'function') {
            return window.recordAnswerOriginal(answer, questionType);
        }
        
        return false;
    }
    
    function handleVoiceResultOptimized(transcript) {
        if (!transcript || typeof window.voiceState === 'undefined' || !window.voiceState.active) {
            return;
        }
        
        const now = performance.now();
        
        // Fast debouncing
        if (window.voiceState.lastProcessTime && (now - window.voiceState.lastProcessTime) < 300) {
            return;
        }
        window.voiceState.lastProcessTime = now;
        
        const lower = transcript.toLowerCase();
        console.log('Processing (optimized):', transcript);
        
        // Quick command detection
        const quickCommands = {
            'next': 'NEXT_QUESTION',
            'skip': 'SKIP_QUESTION', 
            'repeat': 'REPEAT_QUESTION',
            'previous': 'PREVIOUS_QUESTION',
            'help': 'HELP',
            'stop': 'END_SURVEY',
            'التالي': 'NEXT_QUESTION',
            'السابق': 'PREVIOUS_QUESTION',
            'أعد': 'REPEAT_QUESTION'
        };
        
        for (const [word, command] of Object.entries(quickCommands)) {
            if (lower.includes(word)) {
                if (typeof window.handleVoiceCommand === 'function') {
                    window.handleVoiceCommand(command);
                }
                return;
            }
        }
        
        // Process as answer
        const question = typeof window.getCurrentQuestion === 'function' ? 
                        window.getCurrentQuestion() : null;
        if (!question) return;
        
        // Check if this should go to a comment field first
        if (handleCommentInput(transcript, question.id)) {
            if (typeof window.updateVoiceStatus === 'function') {
                window.updateVoiceStatus('Comment added', 'success');
            }
            // Don't advance to next question for comments
            return;
        }
        
        const answer = parseAnswerOptimized(transcript, question.question_type);
        
        if (answer !== null) {
            // Fast recording
            if (recordAnswerOptimized(answer, question.question_type)) {
                // Minimal feedback for speed
                if (typeof window.updateVoiceStatus === 'function') {
                    window.updateVoiceStatus(`✓ ${answer}`, 'success');
                }
                
                // Quick confirmation sound
                if (typeof window.speak === 'function') {
                    const isArabic = typeof window.state !== 'undefined' && window.state.currentLang === 'ar';
                    const confirmMsg = isArabic ? 'تم' : 'OK';
                    window.speak(confirmMsg, { rate: 1.5, withBeep: false });
                }
                
                // Auto-advance quickly
                setTimeout(() => {
                    if (window.voiceState.active && 
                        typeof window.moveToNextQuestion === 'function' && 
                        window.moveToNextQuestion()) {
                        askCurrentQuestionOptimized();
                    }
                }, 700);
            }
        } else {
            // Quick retry feedback
            if (typeof window.updateVoiceStatus === 'function') {
                window.updateVoiceStatus('Try again', 'error');
            }
        }
    }
    
    function askCurrentQuestionOptimized() {
        const question = typeof window.getCurrentQuestion === 'function' ? 
                        window.getCurrentQuestion() : null;
        if (!question) {
            if (typeof window.completeSurvey === 'function') {
                window.completeSurvey();
            }
            return;
        }
        
        const isArabic = typeof window.state !== 'undefined' && window.state.currentLang === 'ar';
        
        // Shorter question format for speed
        const questionText = isArabic ? 
                           (question.text_ar || question.text_en) :
                           question.text_en;
        
        if (typeof window.voiceState !== 'undefined') {
            window.voiceState.questionStartTime = performance.now();
        }
        
        if (typeof window.speak === 'function') {
            window.speak(questionText, { rate: 1.3, force: false });
        }
        
        if (typeof window.updateVoiceProgress === 'function') {
            window.updateVoiceProgress();
        }
    }
    
    // Enhanced voice processing for comment fields
    function handleCommentInput(transcript, questionId) {
        // Check if this is intended for a comment field
        const commentKeywords = ['comment', 'note', 'observation', 'additional', 'تعليق', 'ملاحظة'];
        const lower = transcript.toLowerCase();
        
        if (commentKeywords.some(keyword => lower.includes(keyword))) {
            const commentField = document.querySelector(`textarea[name="comment_${questionId}"]`);
            if (commentField) {
                // Extract the comment content (remove the keyword)
                let commentText = transcript;
                commentKeywords.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword}\\b:?\\s*`, 'gi');
                    commentText = commentText.replace(regex, '');
                });
                
                commentField.value = commentText.trim();
                commentField.dispatchEvent(new Event('input', { bubbles: true }));
                
                return true; // Handled as comment
            }
        }
        
        return false; // Not a comment
    }
    
    // Disable comment field focus during voice mode to prevent confusion
    function disableCommentFieldsDuringVoice() {
        if (typeof window.voiceState !== 'undefined' && window.voiceState.active) {
            const commentFields = document.querySelectorAll('textarea[name^="comment_"]');
            commentFields.forEach(field => {
                field.setAttribute('data-voice-disabled', 'true');
                field.style.opacity = '0.5';
            });
        }
    }
    
    function enableCommentFields() {
        const commentFields = document.querySelectorAll('textarea[name^="comment_"]');
        commentFields.forEach(field => {
            field.removeAttribute('data-voice-disabled');
            field.style.opacity = '';
        });
    }
    
    // Override voice mode start/stop to handle comments
    if (typeof window.startVoiceMode === 'function') {
        const originalStartVoiceMode = window.startVoiceMode;
        window.startVoiceMode = function() {
            disableCommentFieldsDuringVoice();
            return originalStartVoiceMode.apply(this, arguments);
        };
    }
    
    if (typeof window.stopVoiceMode === 'function') {
        const originalStopVoiceMode = window.stopVoiceMode;
        window.stopVoiceMode = function() {
            enableCommentFields();
            return originalStopVoiceMode.apply(this, arguments);
        };
    }
    
})();
