/**
 * @file Handles survey form submission and result display.
 * @description This module initializes the survey form, collects data on submit,
 * sends it to the backend API, and displays the response.
 */

import { QUESTIONS } from './survey_config.js';
import { state } from './survey_state.js';

/**
 * Gathers all form data into a structured payload for the API.
 * @param {FormData} data - The FormData object from the survey form.
 * @returns {object} The submission payload.
 */
function buildPayload(data) {
    // Get all form fields that match question pattern (either Q1, Q2... or SVC_001, etc.)
    const scores = [];
    const latencySamples = [];
    
    // Iterate through form data to find question responses
    for (const [key, value] of data.entries()) {
        // Check if this is a question field (starts with Q or contains underscore)
        if ((key.startsWith('Q') && /^Q\d+$/.test(key)) || key.includes('_')) {
            const score = parseInt(value, 10);
            if (score && score >= 1 && score <= 5) {
                scores.push({
                    question_id: key,
                    score: score,
                    comment: (data.get('comment_' + key) || '').trim() || undefined
                });
            }
        }
    }
    
    // Get latency samples from global state, matching questions we have scores for
    const questionIds = new Set(scores.map(s => s.question_id));
    const availableLatency = (window.__latencySamplesSent || state.latencySamples || []).slice(-25);
    
    for (const sample of availableLatency) {
        if (sample && sample.question_id && questionIds.has(sample.question_id) && sample.ms > 0) {
            latencySamples.push({
                question_id: sample.question_id,
                ms: parseFloat(sample.ms)
            });
        }
    }

    return {
        channel: data.get('channel'),
        location_code: data.get('location_code'),
        shopper_id: data.get('shopper_id'),
        visit_datetime: new Date(data.get('visit_datetime')).toISOString(),
        scores: scores,
        latency_samples: latencySamples
    };
}

/**
 * Handles the form submission event.
 * @param {Event} e - The submit event.
 * @param {HTMLFormElement} form - The survey form element.
 * @param {HTMLElement} resultEl - The element to display results in.
 */
async function handleFormSubmit(e, form, resultEl) {
    e.preventDefault();
    resultEl.textContent = 'Submitting...';

    try {
        const data = new FormData(form);
        const payload = buildPayload(data);

        // Debug logging
        console.log('Form submission payload:', payload);
        console.log('Number of scores:', payload.scores.length);
        console.log('Question IDs found:', payload.scores.map(s => s.question_id));

        const response = await fetch('/api/survey/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const jsonResponse = await response.json();

        if (!response.ok) {
            const errorMessage = jsonResponse.detail || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        resultEl.textContent = JSON.stringify(jsonResponse, null, 2);
        resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        let errorMessage = err.message;
        
        // If it's a validation error, try to show more details
        if (err.message.includes('422') || err.message.includes('Unprocessable Entity')) {
            try {
                const response = await fetch('/api/survey/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const errorDetails = await response.json();
                if (errorDetails.detail) {
                    errorMessage = Array.isArray(errorDetails.detail) 
                        ? errorDetails.detail.map(d => d.msg || d).join(', ')
                        : errorDetails.detail;
                }
            } catch (detailError) {
                // Ignore if we can't get details
            }
        }
        
        resultEl.textContent = 'Submission failed: ' + errorMessage;
        console.error('Submission error:', err);
        console.error('Payload that failed:', payload);
    }
}

/**
 * Sets the default visit time on the date/time input field.
 * @param {HTMLFormElement} form
 */
function setDefaultDateTime(form) {
    try {
        // Sets the value to the current local time in "YYYY-MM-DDTHH:mm" format
        form.visit_datetime.value = new Date().toISOString().slice(0, 16);
    } catch (e) {
        console.warn("Could not set default visit_datetime:", e);
    }
}

/**
 * Initializes the survey submission logic.
 * Sets default values and attaches event listeners to the form.
 */
export function initSubmit() {
    const form = document.getElementById('surveyForm');
    const resultEl = document.getElementById('result');
    const resetBtn = document.getElementById('resetBtn');

    if (!form || !resultEl) {
        console.error('Required form elements (surveyForm, result) not found.');
        return;
    }

    setDefaultDateTime(form);

    form.addEventListener('submit', (e) => handleFormSubmit(e, form, resultEl));

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            resultEl.textContent = 'Form reset.';
            // Also reset the default time after the form is cleared
            setDefaultDateTime(form);
        });
    }
}
