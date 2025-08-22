/**
 * @file Survey form language and debug mode handling
 * @description Handles language switching, question text updates, and debug visibility
 */

// Global language state
let currentLanguage = window.__CURRENT_LANGUAGE || 'en';

/**
 * Switch to a different language by updating the URL
 * @param {string} newLang - The new language code ('en' or 'ar')
 */
function switchLanguage(newLang) {
  if (newLang === currentLanguage) return;
  
  // Update URL and reload with new language
  const url = new URL(window.location);
  url.searchParams.set('lang', newLang);
  window.location.href = url.toString();
}

/**
 * Update question text based on current language
 */
function updateQuestionTexts() {
  const isArabic = currentLanguage === 'ar';
  
  document.querySelectorAll('.question-text').forEach(element => {
    const enText = element.getAttribute('data-en');
    const arText = element.getAttribute('data-ar');
    
    if (isArabic && arText) {
      element.textContent = arText;
      element.parentElement.parentElement.setAttribute('dir', 'rtl');
    } else {
      element.textContent = enText.toUpperCase();
      element.parentElement.parentElement.removeAttribute('dir');
    }
  });
  
  // Update legend
  const legend = document.getElementById('scoresLegend');
  if (legend) {
    legend.textContent = isArabic ? 'درجات التقييم' : 'Experience Scores';
  }
  
  // Update form direction
  if (isArabic) {
    document.body.classList.add('lang-ar');
  } else {
    document.body.classList.remove('lang-ar');
  }
}

/**
 * Update debug element visibility based on debug mode state
 */
function updateDebugVisibility() {
  const isDebugMode = localStorage.getItem('voiceDebugVisible') === '1';
  const debugElements = document.querySelectorAll('.debug-only');
  
  debugElements.forEach(element => {
    element.style.display = isDebugMode ? '' : 'none';
  });
}

/**
 * Initialize survey form functionality
 */
function initSurveyForm() {
  // Set current language from window global or language select
  if (window.__CURRENT_LANGUAGE) {
    currentLanguage = window.__CURRENT_LANGUAGE;
  } else {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      currentLanguage = languageSelect.value;
    }
  }
  
  // Initialize language display and debug visibility
  updateQuestionTexts();
  updateDebugVisibility();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSurveyForm);

// Listen for debug toggle events
window.addEventListener('toggle-transcript-debug', updateDebugVisibility);

// Make functions available globally for inline event handlers
window.switchLanguage = switchLanguage;
