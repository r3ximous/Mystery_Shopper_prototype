import { setupDOM, pushTranscript } from './survey_dom.js';
import { state } from './survey_state.js';
import { speak } from './survey_tts.js';
import { getRMS } from './survey_vad.js';

// Command & scoring handled in survey_commands.js

export function initVoice(){
  setupDOM();
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    console.warn('SpeechRecognition not supported');
    return;
  }
  const recog = new SpeechRecognition();
  state.recognition = recog;
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = state.currentLang === 'ar' ? 'ar-SA':'en-US';
  recog.onstart = () => { state.listening = true; state.lastStart = performance.now(); try{ pushTranscript('[system] recognition started'); }catch(_){} };
  recog.onend = () => { state.listening = false; try{ pushTranscript('[system] recognition ended'); }catch(_){} if(document.getElementById('voiceBtn')?.dataset.mode==='on') recog.start(); };
  recog.onresult = (e) => {
    for(let i=e.resultIndex;i<e.results.length;i++){
      const res = e.results[i];
      const txt = res[0].transcript.trim();
      if(!res.isFinal){
        const onlinePartial = document.getElementById('onlinePartial');
        if(onlinePartial) onlinePartial.textContent = txt;
        if(localStorage.getItem('voiceDebugVisible')==='1') try{ pushTranscript(`[partial] ${txt}`); }catch(_){ }
        continue;
      }
      if(getRMS && getRMS() < 0.01) continue; // silence gate
  pushTranscript(`[online] ${txt}`);
  window.dispatchEvent(new CustomEvent('survey-final-transcript',{detail:{ text: txt }}));
      const latency = performance.now() - state.lastStart;
      state.latencySamples.push(latency);
      window.__latencySamplesSent = state.latencySamples.slice(-25);
    }
  };
  function startVoice(){
    if(!state.listening){
      recog.start();
      document.getElementById('voiceBtn').dataset.mode='on';
      document.getElementById('voiceBtn').textContent='Stop Voice';
      speak(state.currentLang==='ar'?'بدء الوضع الصوتي':'Voice mode started',{withBeep:true});
  // Notify command module to begin asking questions
  window.dispatchEvent(new Event('survey-voice-start'));
    }
  }
  function stopVoice(){
    if(state.listening){
      document.getElementById('voiceBtn').dataset.mode='off';
      document.getElementById('voiceBtn').textContent='Start Voice';
      try { recog.stop(); } catch(_){}
    }
  }
  document.getElementById('voiceBtn')?.addEventListener('click', () => state.listening? stopVoice(): startVoice());
  window.addEventListener('survey-wake-word', startVoice);
  document.getElementById('langBtn')?.addEventListener('click', () => {
    state.currentLang = state.currentLang==='en'?'ar':'en';
    recog.lang = state.currentLang === 'ar' ? 'ar-SA':'en-US';
    document.getElementById('langBtn').textContent = state.currentLang.toUpperCase();
    speak(state.currentLang==='ar'?'تم اختيار العربية':'English selected', {withBeep:false});
  });
  // progress handled externally

  // Bridge offline ASR custom events
  window.addEventListener('survey-offline-result', (ev) => {
    const detail = ev.detail || {};
    if(!detail.text) return;
    pushTranscript(`[offline] ${detail.text}`);
    window.dispatchEvent(new CustomEvent('survey-final-transcript',{detail:{ text: detail.text }}));
  });
  return {
    getLang: () => state.currentLang,
    pauseRecognition: () => { try { recog.stop(); } catch(_){} },
    resumeRecognition: () => { if(document.getElementById('voiceBtn')?.dataset.mode==='on'){ try { recog.start(); } catch(_){} } },
    startVoice,
    stopVoice
  };
}
