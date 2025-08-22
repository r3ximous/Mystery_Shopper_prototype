import { initSubmit } from './survey_submit.js';
import { initTTS } from './survey_tts.js';
import { initVAD } from './survey_vad.js';
import './survey_dom.js';
import { initFlow } from './survey_flow.js';

window.addEventListener('DOMContentLoaded', () => {
  initSubmit();
  // Initialize base flow (sets up recognition + event hooks)
  initFlow();
  // TTS / VAD modules (language accessor provided via state in flow)
  const getLang = () => (window?.state?.currentLang) || 'en';
  initTTS(getLang, () => {}, () => {});
  initVAD();
});
