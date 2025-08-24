// Survey progress tracking and language toggle functionality

// Inject survey questions from backend (will be set by template)
// window.__SURVEY_QUESTIONS is injected from the template

// Progress tracking for comprehensive survey
document.addEventListener('DOMContentLoaded', function() {
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
  
  function updateProgress() {
    if (!form) return;
    
    const formData = new FormData(form);
    let answeredCount = 0;
    
    // Count answered questions by checking all form inputs
    const questionInputs = form.querySelectorAll('input[type="radio"]:checked');
    const uniqueQuestions = new Set();
    
    questionInputs.forEach(input => {
      const questionId = input.name;
      uniqueQuestions.add(questionId);
    });
    
    answeredCount = uniqueQuestions.size;
    
    const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    
    if (progressFill) {
      progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
      progressText.textContent = percentage + '% Complete';
    }
    
    if (questionCount) {
      questionCount.textContent = answeredCount + '/' + totalQuestions + ' answered';
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
    form.addEventListener('change', updateProgress);
    
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
  
  // Initial progress update
  updateProgress();
});
