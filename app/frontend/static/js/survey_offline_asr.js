// Offline ASR (Vosk) integration module
// Requires vosk_loader.js to have been loaded, exposing window.initVosk & window.VoskController

export function initOfflineASR(getLang, startVoice){
  const offlineBtn = document.getElementById('offlineBtn');
  if(!offlineBtn) return;
  const asrSpinner = document.getElementById('asrSpinner');
  const cpuLoadEl = document.getElementById('cpuLoad');
  const asrRetryBtn = document.getElementById('asrRetryBtn');
  const offlinePartial = document.getElementById('offlinePartial');
  const savedOffline = localStorage.getItem('offlineASR') === '1';
  if(savedOffline){ offlineBtn.setAttribute('aria-pressed','true'); offlineBtn.classList.add('active'); }

  offlineBtn.addEventListener('click', () => {
    const enabled = offlineBtn.getAttribute('aria-pressed') === 'true';
    const next = !enabled; offlineBtn.setAttribute('aria-pressed', next); offlineBtn.classList.toggle('active', next);
    localStorage.setItem('offlineASR', next ? '1':'0');
    if(next){ if(window.VoskController){ window.VoskController.enable(); window.VoskController.setLanguage(getLang()); announce('Offline ASR on'); } }
    else { if(window.VoskController){ window.VoskController.disable(); announce('Offline ASR off'); } }
  });

  function announce(msg){ const vs = document.getElementById('voiceStatus'); if(vs) vs.textContent = msg; }

  window.addEventListener('vosk-ready', ()=>{ offlineBtn.disabled=false; if(asrSpinner) asrSpinner.style.display='none'; if(savedOffline && window.VoskController){ window.VoskController.enable(); window.VoskController.setLanguage(getLang()); } if(asrRetryBtn) asrRetryBtn.style.display='none'; });
  window.addEventListener('vosk-error', (e)=>{ offlineBtn.disabled=true; if(asrSpinner) asrSpinner.style.display='none'; if(asrRetryBtn) asrRetryBtn.style.display='inline-block'; offlineBtn.title='Offline ASR error: '+(e.detail?.error||'unknown'); });
  window.addEventListener('vosk-cpu', (e)=>{ const d=e.detail; if(cpuLoadEl){ cpuLoadEl.style.display='inline'; cpuLoadEl.textContent = 'CPU: '+Math.round(d.load*100)+'% @'+d.interval+'ms'; } });

  if(asrRetryBtn){ asrRetryBtn.addEventListener('click', ()=>{ asrRetryBtn.textContent='Retrying...'; window.dispatchEvent(new Event('vosk-retry')); setTimeout(()=>{ asrRetryBtn.textContent='Retry Model'; }, 1200); }); }

  if(window.initVosk){
    window.initVosk({
      onPartial: (text) => { if(offlinePartial) offlinePartial.textContent = '· '+text; },
      onResult: (text) => { if(offlinePartial) offlinePartial.textContent=''; window.dispatchEvent(new CustomEvent('survey-offline-result',{detail:{text}})); },
      wakeWord: () => { window.dispatchEvent(new Event('survey-wake-word')); startVoice(); }
    });
  }
}
