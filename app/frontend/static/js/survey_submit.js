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
    return {
        channel: data.get('channel'),
        location_code: data.get('location_code'),
        shopper_id: data.get('shopper_id'),
        visit_datetime: new Date(data.get('visit_datetime')).toISOString(),
        scores: QUESTIONS.map(q => ({
            question_id: q.id,
            score: parseInt(data.get(q.id), 10) || 0, // Ensure score is a number
            comment: (data.get('comment_' + q.id) || '').trim() || undefined
        })),
        // Use the latency samples captured during the voice session, limit to last 25
        latency_samples: (window.__latencySamplesSent || state.latencySamples || []).slice(-25)
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
        resultEl.textContent = 'Submission failed: ' + err.message;
        console.error('Submission error:', err);
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
