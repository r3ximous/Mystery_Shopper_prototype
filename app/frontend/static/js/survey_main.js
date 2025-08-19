import { initVoice } from './survey_voice.js';
import { initSubmit } from './survey_submit.js';
import { initTTS } from './survey_tts.js';
import { initVAD } from './survey_vad.js';
import { initOfflineASR } from './survey_offline_asr.js';
import './survey_dom.js';
import { initCommands } from './survey_commands.js';

window.addEventListener('DOMContentLoaded', () => {
  initSubmit();
  const voiceApi = initVoice();
  initCommands({ getLang: voiceApi.getLang });
  initTTS(voiceApi.getLang, voiceApi.pauseRecognition, voiceApi.resumeRecognition);
  initVAD();
  initOfflineASR(voiceApi.getLang, voiceApi.startVoice);
});
