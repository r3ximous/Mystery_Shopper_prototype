// Text-to-Speech + beep utility encapsulated
let voicesLoaded = false;
const preferred = { en:null, ar:null };
let getLangFn = () => 'en';
let pauseFn = () => {}; let resumeFn = () => {};

export function initTTS(getLang, pause, resume){
  getLangFn = getLang; pauseFn = pause; resumeFn = resume;
  if('speechSynthesis' in window){
    speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 200);
  }
}

function loadVoices(){
  if(!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  if(!vs.length) return;
  preferred.en = vs.find(v=>/en-US/i.test(v.lang) && /female/i.test(v.name)) || vs.find(v=>/en/i.test(v.lang));
  preferred.ar = vs.find(v=>/ar[-_]/i.test(v.lang));
  voicesLoaded = true;
  warmTTS();
}

function warmTTS(){
  if(!voicesLoaded) return;
  try { const u = new SpeechSynthesisUtterance('.'); u.volume = 0; u.lang = 'en-US'; speechSynthesis.speak(u); } catch(_){}
}

const ACtx = (()=>{ try { return new (window.AudioContext||window.webkitAudioContext)(); } catch(_){ return null; } })();
export function beep(freq=300, duration=80){
  if(!ACtx) return;
  try { const osc = ACtx.createOscillator(); const gain = ACtx.createGain(); osc.type='sine'; osc.frequency.value=freq; osc.connect(gain); gain.connect(ACtx.destination); gain.gain.value = 0.18; osc.start(); osc.stop(ACtx.currentTime + duration/1000); } catch(_){}
}

export function speak(text, {force=false, withBeep=true}={}){
  if(!('speechSynthesis' in window)) return;
  if(force){ try { speechSynthesis.cancel(); } catch(_){} }
  pauseFn();
  if(withBeep) beep();
  const utter = new SpeechSynthesisUtterance(text);
  const lang = getLangFn();
  utter.lang = lang==='ar' ? 'ar-SA' : 'en-US';
  const v = preferred[lang]; if(v) utter.voice = v;
  utter.rate = 1;
  utter.onend = () => { resumeFn(); };
  try { speechSynthesis.speak(utter); } catch(_){ resumeFn(); }
}

export function cancelSpeak(){ try { speechSynthesis.cancel(); } catch(_){} }
