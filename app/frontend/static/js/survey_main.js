import { initSubmit } from './survey_submit.js';
import { initTTS } from './survey_tts.js';
import { initVAD } from './survey_vad.js';
import './survey_dom.js';
import { initEnhancedFlow } from './survey_enhanced_flow.js';
import { addHelpButton } from './survey_voice_help.js';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize form submission
  initSubmit();
  
  // Initialize enhanced voice flow for comprehensive survey
  initEnhancedFlow();
  
  // Add voice help system
  addHelpButton();
  
  // TTS / VAD modules with language accessor
  const getLang = () => (window?.state?.currentLang) || 'en';
  initTTS(getLang, () => {}, () => {});
  initVAD();
  
  // Initialize voice state exposure
  window.state = window.state || { currentLang: 'en' };
  
  // Add voice mode indicator to progress bar
  addVoiceModeIndicator();
  
  // Add voice accessibility announcements
  addAccessibilityFeatures();
});

function addVoiceModeIndicator() {
  const progressBar = document.querySelector('.survey-progress');
  if (progressBar) {
    const indicator = document.createElement('div');
    indicator.id = 'voiceModeIndicator';
    indicator.className = 'voice-mode-indicator';
    indicator.innerHTML = '🎤 <span>Voice Ready</span>';
    indicator.style.display = 'none';
    progressBar.appendChild(indicator);
  }
}

function addAccessibilityFeatures() {
  // Add ARIA labels and voice instructions
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.setAttribute('aria-label', 'Toggle voice recognition mode for hands-free survey completion');
  }
  
  // Add voice instructions to the page
  const instructions = document.createElement('div');
  instructions.className = 'voice-instructions sr-only';
  instructions.innerHTML = `
    Voice mode allows you to complete the survey using speech commands. 
    Click the voice button or press the floating microphone to start. 
    Say numbers 1-5 for ratings, yes or no for questions, and commands like next, previous, or help.
  `;
  document.body.appendChild(instructions);
}
