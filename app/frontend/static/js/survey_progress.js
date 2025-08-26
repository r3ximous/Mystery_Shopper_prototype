// Survey progress tracking and language toggle functionality

// Inject survey questions from backend (will be set by template)
// window.__SURVEY_QUESTIONS is injected from the template

// Generate conditional logic mapping dynamically from questions data
function generateConditionalRules() {
  const rules = {};
  
  console.log('[DEBUG] window.__SURVEY_QUESTIONS available:', !!window.__SURVEY_QUESTIONS);
  console.log('[DEBUG] Questions data:', window.__SURVEY_QUESTIONS ? window.__SURVEY_QUESTIONS.length + ' questions' : 'undefined');
  
  if (window.__SURVEY_QUESTIONS && Array.isArray(window.__SURVEY_QUESTIONS)) {
    window.__SURVEY_QUESTIONS.forEach(question => {
      console.log(`[DEBUG] Processing question ${question.id}: has_conditions=${question.has_conditions}, conditions="${question.conditions}"`);
      
      if (question.has_conditions && question.conditions && question.conditions.trim()) {
        const condition = question.conditions.trim();
        
        // Parse condition format: "show if Q51 is yes" or "hide if Q72 is no"
        if (condition.toLowerCase().includes('show if')) {
          rules[question.id] = { show: condition };
          console.log(`[DEBUG] Added show rule for ${question.id}: ${condition}`);
        } else if (condition.toLowerCase().includes('hide if')) {
          rules[question.id] = { hide: condition };
          console.log(`[DEBUG] Added hide rule for ${question.id}: ${condition}`);
        } else {
          console.log(`[DEBUG] Unrecognized condition format for ${question.id}: "${condition}"`);
        }
      }
    });
  } else {
    console.error('[DEBUG] window.__SURVEY_QUESTIONS is not available or not an array');
  }
  
  console.log(`[DEBUG] Generated ${Object.keys(rules).length} conditional rules from questions data:`, rules);
  return rules;
}

// Generate conditional rules from questions data
let CONDITIONAL_RULES = {}; // Will be populated when DOM is ready

// Progress tracking for comprehensive survey
document.addEventListener('DOMContentLoaded', function() {
  // Generate conditional rules now that the page is loaded
  CONDITIONAL_RULES = generateConditionalRules();
  
  // Add a temporary debug indicator
  if (Object.keys(CONDITIONAL_RULES).length > 0) {
    const header = document.querySelector('h1');
    if (header) {
      const debugSpan = document.createElement('span');
      debugSpan.style.fontSize = '0.6em';
      debugSpan.style.color = '#28a745';
      debugSpan.style.marginLeft = '10px';
      debugSpan.textContent = `(${Object.keys(CONDITIONAL_RULES).length} conditional rules loaded)`;
      header.appendChild(debugSpan);
    }
  }
  
  const form = document.getElementById('surveyForm');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const questionCount = document.getElementById('question-count');
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langText = document.getElementById('lang-text');
  
  // Get total questions count from injected data
  const totalQuestions = window.__SURVEY_QUESTIONS ? window.__SURVEY_QUESTIONS.length : 0;
  
  // Language toggle functionality
  let currentLang = 'en';
  
  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    
    // Hide all current language elements
    document.querySelectorAll(`[data-lang]`).forEach(el => {
      // Don't hide the language toggle button itself
      if (!el.closest('.language-toggle')) {
        el.style.display = 'none';
      }
    });
    
    // Show elements for selected language
    document.querySelectorAll(`[data-lang="${currentLang}"]`).forEach(el => {
      // Don't affect the language toggle button
      if (!el.closest('.language-toggle')) {
        el.style.display = currentLang === 'ar' ? 'block' : 'inline';
        if (el.classList.contains('q-text') && currentLang === 'ar') {
          el.style.display = 'block';
        }
      }
    });
    
    // Update button text and styling
    if (currentLang === 'ar') {
      langText.textContent = 'English';
      langToggleBtn.dataset.lang = 'ar';
      document.body.classList.add('rtl-mode');
    } else {
      langText.textContent = 'عربي';
      langToggleBtn.dataset.lang = 'en';
      document.body.classList.remove('rtl-mode');
    }
  }
  
  // Add click event to language toggle button
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', toggleLanguage);
  }
  
  // Function to evaluate conditional rules
  function evaluateCondition(rule, triggerQuestionId, triggerValue) {
    const condition = rule.show || rule.hide;
    
    console.log(`[DEBUG] Evaluating condition: "${condition}" for trigger Q${triggerQuestionId}="${triggerValue}"`);
    
    // Parse condition string (e.g., "if Q18 is 1 or 2", "if Q51 is yes")
    const match = condition.match(/if\s+(\w+(?:\.\w+)?)\s+is\s+(.+)/i);
    if (!match) {
      console.log(`[DEBUG] Could not parse condition: "${condition}"`);
      return false;
    }
    
    const expectedQuestionId = match[1];
    const expectedValues = match[2].toLowerCase();
    
    console.log(`[DEBUG] Expected Q${expectedQuestionId} to be "${expectedValues}"`);
    
    if (triggerQuestionId !== expectedQuestionId) {
      console.log(`[DEBUG] Wrong trigger question (expected ${expectedQuestionId}, got ${triggerQuestionId})`);
      return false;
    }
    
    // Handle different value formats
    if (expectedValues.includes(' or ')) {
      // Multiple values: "1 or 2" or "1 or 2 or 3"
      const validValues = expectedValues.split(' or ').map(v => v.trim());
      const result = validValues.includes(triggerValue);
      console.log(`[DEBUG] Multiple values check: ${validValues} includes "${triggerValue}" = ${result}`);
      return result;
    } else if (expectedValues === 'yes') {
      // Yes condition - check for value 1 (yes) or string "yes"
      const result = triggerValue === '1' || triggerValue.toLowerCase() === 'yes';
      console.log(`[DEBUG] Yes condition: "${triggerValue}" = ${result}`);
      return result;
    } else if (expectedValues === 'no') {
      // No condition - check for value 0 (no) or string "no"  
      const result = triggerValue === '0' || triggerValue.toLowerCase() === 'no';
      console.log(`[DEBUG] No condition: "${triggerValue}" = ${result}`);
      return result;
    } else {
      // Single value
      const result = triggerValue === expectedValues;
      console.log(`[DEBUG] Single value check: "${triggerValue}" === "${expectedValues}" = ${result}`);
      return result;
    }
  }
  
  // Function to update conditional question visibility
  function updateConditionalQuestions() {
    if (!form) return;
    
    console.log(`[DEBUG] Updating conditional questions...`);
    
    // Get current form values
    const formData = new FormData(form);
    
    // Check each conditional rule
    Object.keys(CONDITIONAL_RULES).forEach(questionId => {
      const rule = CONDITIONAL_RULES[questionId];
      const questionCard = document.querySelector(`[data-q="${questionId}"]`);
      
      if (!questionCard) {
        console.log(`[DEBUG] Question card not found for ${questionId}`);
        return;
      }
      
      console.log(`[DEBUG] Processing conditional question ${questionId} with rule:`, rule);
      
      // Extract the trigger question from the rule
      const condition = rule.show || rule.hide;
      const match = condition.match(/if\s+(\w+(?:\.\w+)?)\s+is\s+(.+)/);
      if (!match) {
        console.log(`[DEBUG] Could not parse condition for ${questionId}: "${condition}"`);
        return;
      }
      
      const triggerQuestionId = match[1];
      const triggerValue = formData.get(triggerQuestionId);
      
      console.log(`[DEBUG] Trigger question ${triggerQuestionId} current value: "${triggerValue}"`);
      
      // Evaluate the condition
      let shouldShow = false;
      if (triggerValue) {
        if (rule.show) {
          shouldShow = evaluateCondition(rule, triggerQuestionId, triggerValue);
        } else if (rule.hide) {
          shouldShow = !evaluateCondition(rule, triggerQuestionId, triggerValue);
        }
      }
      
      console.log(`[DEBUG] Question ${questionId} should show: ${shouldShow}`);
      
      // Show/hide the question
      if (shouldShow) {
        questionCard.style.display = 'block';
        questionCard.classList.remove('hidden-conditional');
        console.log(`[DEBUG] Showing question ${questionId}`);
      } else {
        questionCard.style.display = 'none';
        questionCard.classList.add('hidden-conditional');
        console.log(`[DEBUG] Hiding question ${questionId}`);
        
        // Clear any answers for hidden questions
        const inputs = questionCard.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => {
          input.checked = false;
        });
        
        // Remove selected styling
        const labels = questionCard.querySelectorAll('label');
        labels.forEach(label => {
          label.classList.remove('selected');
        });
      }
    });
  }
  
  function updateProgress() {
    if (!form) return;
    
    const formData = new FormData(form);
    let answeredCount = 0;
    
    // Count answered questions, excluding hidden conditional ones
    const questionInputs = form.querySelectorAll('input[type="radio"]:checked');
    const uniqueQuestions = new Set();
    
    questionInputs.forEach(input => {
      const questionCard = input.closest('[data-q]');
      // Only count if the question is visible (not conditionally hidden)
      if (questionCard && !questionCard.classList.contains('hidden-conditional')) {
        const questionId = input.name;
        uniqueQuestions.add(questionId);
      }
    });
    
    answeredCount = uniqueQuestions.size;
    
    // Calculate total visible questions (excluding hidden conditional ones)
    const allQuestionCards = form.querySelectorAll('[data-q]');
    let totalVisibleQuestions = 0;
    allQuestionCards.forEach(card => {
      if (!card.classList.contains('hidden-conditional')) {
        totalVisibleQuestions++;
      }
    });
    
    const percentage = totalVisibleQuestions > 0 ? Math.round((answeredCount / totalVisibleQuestions) * 100) : 0;
    
    if (progressFill) {
      progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
      progressText.textContent = percentage + '% Complete';
    }
    
    if (questionCount) {
      questionCount.textContent = answeredCount + '/' + totalVisibleQuestions + ' answered';
    }
    
    // Change color based on progress
    if (progressFill) {
      if (percentage === 100) {
        progressFill.style.background = '#059669'; // green when complete
      } else {
        progressFill.style.background = 'var(--accent)'; // gold for progress
      }
    }
  }
  
  // Update progress when any input changes
  if (form) {
    form.addEventListener('change', function(e) {
      // Update conditional questions first
      updateConditionalQuestions();
      // Then update progress
      updateProgress();
    });
    
    // Add visual feedback for selected answers
    form.addEventListener('change', function(e) {
      if (e.target.type === 'radio') {
        const questionName = e.target.name;
        
        // Remove selected class from all labels for this question
        const allLabels = form.querySelectorAll(`label[for^="${questionName}_"]`);
        allLabels.forEach(label => {
          label.classList.remove('selected');
        });
        
        // Add selected class to the clicked label
        const selectedLabel = form.querySelector(`label[for="${e.target.id}"]`);
        if (selectedLabel) {
          selectedLabel.classList.add('selected');
        }
      }
    });
    
    // Initialize already selected answers on page load
    const checkedInputs = form.querySelectorAll('input[type="radio"]:checked');
    checkedInputs.forEach(input => {
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (label) {
        label.classList.add('selected');
      }
    });
    
    // Also add click handlers directly to labels for better compatibility
    const allLabels = form.querySelectorAll('label.btn-option, label.choice-option');
    allLabels.forEach(label => {
      label.addEventListener('click', function() {
        // Small delay to let the radio button change first
        setTimeout(() => {
          const forId = this.getAttribute('for');
          const input = document.getElementById(forId);
          if (input && input.checked) {
            // Remove selected from siblings
            const questionName = input.name;
            const siblingLabels = form.querySelectorAll(`label[for^="${questionName}_"]`);
            siblingLabels.forEach(sibling => sibling.classList.remove('selected'));
            
            // Add selected to this label
            this.classList.add('selected');
          }
        }, 10);
      });
    });
  }
  
  // Initial setup - hide conditional questions and update progress
  updateConditionalQuestions();
  updateProgress();
});
