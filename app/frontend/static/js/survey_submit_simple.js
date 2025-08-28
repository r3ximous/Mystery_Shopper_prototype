/**
 * Simple Survey Form Submission Handler
 * Handles form submission without complex voice module dependencies
 */

console.log('📝 Simple Survey Submit Handler Loading...');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const surveyForm = document.getElementById('surveyForm');
    const resultBox = document.getElementById('result');
    
    if (surveyForm) {
        surveyForm.addEventListener('submit', handleSubmit);
        console.log('✅ Survey form submit handler attached');
    }
    
    // Reset button handler
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            surveyForm.reset();
            resultBox.textContent = '';
            console.log('🔄 Form reset');
        });
    }
});

async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const resultBox = document.getElementById('result');
    
    // Build submission payload
    const payload = buildPayload(formData);
    
    try {
        resultBox.textContent = 'Submitting...';
        
        const response = await fetch('/api/survey/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            resultBox.textContent = JSON.stringify(result, null, 2);
            console.log('✅ Survey submitted successfully', result);
        } else {
            throw new Error(result.detail || 'Submission failed');
        }
    } catch (error) {
        console.error('❌ Submit error:', error);
        resultBox.textContent = `Error: ${error.message}`;
    }
}

function buildPayload(formData) {
    // Get questions from backend injection
    const questions = window.__SURVEY_QUESTIONS || [];
    
    return {
        channel: formData.get('channel'),
        location_code: formData.get('location_code'),
        shopper_id: formData.get('shopper_id'),
        visit_datetime: new Date(formData.get('visit_datetime')).toISOString(),
        scores: questions.map(q => ({
            question_id: q.id,
            score: parseInt(formData.get(q.id), 10) || 0,
            comment: (formData.get('comment_' + q.id) || '').trim() || undefined
        }))
    };
}

console.log('✅ Simple Survey Submit Handler loaded');
