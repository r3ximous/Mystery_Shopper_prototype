/**
 * @file Voice Help System
 * @description Provides contextual help and command reference for voice mode
 */

import { VOICE_COMMANDS, VOICE_MESSAGES } from './survey_config.js';

export function createVoiceHelp() {
  // Create help modal
  const helpModal = document.createElement('div');
  helpModal.id = 'voiceHelpModal';
  helpModal.className = 'voice-help-modal';
  helpModal.innerHTML = `
    <div class="voice-help-content">
      <div class="voice-help-header">
        <h3>🎤 Voice Commands Guide</h3>
        <button type="button" class="close-help">×</button>
      </div>
      <div class="voice-help-body">
        <div class="help-section">
          <h4>📋 Survey Navigation</h4>
          <div class="command-list">
            <div class="command-item">
              <span class="command">Next / التالي</span>
              <span class="description">Move to next question</span>
            </div>
            <div class="command-item">
              <span class="command">Previous / السابق</span>
              <span class="description">Go to previous question</span>
            </div>
            <div class="command-item">
              <span class="command">Repeat / أعد</span>
              <span class="description">Repeat current question</span>
            </div>
            <div class="command-item">
              <span class="command">Skip / تخطي</span>
              <span class="description">Skip current question</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>📊 Answering Questions</h4>
          <div class="command-list">
            <div class="command-item">
              <span class="command">1 to 5 / واحد إلى خمسة</span>
              <span class="description">Rate questions (1=lowest, 5=highest)</span>
            </div>
            <div class="command-item">
              <span class="command">Yes / نعم</span>
              <span class="description">Positive response</span>
            </div>
            <div class="command-item">
              <span class="command">No / لا</span>
              <span class="description">Negative response</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>🗂️ Category Navigation</h4>
          <div class="command-list">
            <div class="command-item">
              <span class="command">Next Category / الفئة التالية</span>
              <span class="description">Move to next category</span>
            </div>
            <div class="command-item">
              <span class="command">Previous Category / الفئة السابقة</span>
              <span class="description">Go to previous category</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>ℹ️ Information & Control</h4>
          <div class="command-list">
            <div class="command-item">
              <span class="command">Status / الحالة</span>
              <span class="description">Check current progress</span>
            </div>
            <div class="command-item">
              <span class="command">Help / مساعدة</span>
              <span class="description">Get voice guidance</span>
            </div>
            <div class="command-item">
              <span class="command">End Survey / انهي التقييم</span>
              <span class="description">Stop voice mode</span>
            </div>
          </div>
        </div>
        
        <div class="help-tips">
          <h4>💡 Tips for Better Recognition</h4>
          <ul>
            <li>Speak clearly and at normal pace</li>
            <li>Use simple, direct phrases</li>
            <li>Wait for the beep before speaking</li>
            <li>Reduce background noise if possible</li>
            <li>Try both English and Arabic commands</li>
          </ul>
        </div>
        
        <div class="help-tips">
          <h4>⌨️ Keyboard Shortcuts</h4>
          <ul>
            <li><kbd>F1</kbd> or <kbd>Ctrl+H</kbd> - Show this help</li>
            <li><kbd>Ctrl+Shift+D</kbd> - Toggle voice debug panel</li>
            <li><kbd>Escape</kbd> - Close help/debug panels</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners
  const closeBtn = helpModal.querySelector('.close-help');
  closeBtn.addEventListener('click', () => hideVoiceHelp());
  
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      hideVoiceHelp();
    }
  });
  
  document.body.appendChild(helpModal);
  
  return helpModal;
}

export function showVoiceHelp() {
  let helpModal = document.getElementById('voiceHelpModal');
  if (!helpModal) {
    helpModal = createVoiceHelp();
  }
  
  helpModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function hideVoiceHelp() {
  const helpModal = document.getElementById('voiceHelpModal');
  if (helpModal) {
    helpModal.style.display = 'none';
  }
  document.body.style.overflow = '';
}

export function addHelpButton() {
  // Add help button to voice controls
  const voiceControls = document.querySelector('.voice-controls');
  if (voiceControls) {
    const helpBtn = document.createElement('button');
    helpBtn.type = 'button';
    helpBtn.className = 'secondary-btn voice-help-btn';
    helpBtn.innerHTML = '❓ Help';
    helpBtn.title = 'Voice Commands Help';
    helpBtn.addEventListener('click', showVoiceHelp);
    
    voiceControls.appendChild(helpBtn);
  }
  
  // Add keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1' || (e.ctrlKey && e.key === 'h')) {
      e.preventDefault();
      showVoiceHelp();
    }
    if (e.key === 'Escape') {
      hideVoiceHelp();
    }
  });
}
