// Advanced command parsing, scoring, confirmation & latency tracking
import { QUESTIONS } from './survey_config.js';
import { speak } from './survey_tts.js';

let getLang = ()=>'en';
let startVoiceSession = ()=>{}; // reserved hooks
let stopVoiceSession = ()=>{};

let active = false;
let qIndex = 0;
let awaitingConfirmation = false;
let pendingScore = null;
let questionStartTime = null;
const latencySamples = []; // {qId, ms}

function voiceStatus(){ return document.getElementById('voiceStatus'); }
function progEl(){ return document.getElementById('voiceProgress'); }
function latencyEl(){ return document.getElementById('latencyStats'); }
function setScore(qid, score){ const radio = document.querySelector(`input[name="${qid}"][value="${score}"]`); if(radio) radio.checked = true; }

function parseSpokenScore(t){
  const norm = t.trim();
  const map = { 'one':1,'1':1,'first':1,'two':2,'2':2,'second':2,'three':3,'3':3,'third':3,'four':4,'for':4,'4':4,'fourth':4,'five':5,'5':5,'fifth':5,'واحد':1,'الأول':1,'اول':1,'١':1,'اثنان':2,'اثنين':2,'الثاني':2,'٢':2,'ثلاثة':3,'الثالث':3,'٣':3,'اربعة':4,'أربعة':4,'الرابع':4,'٤':4,'خمسة':5,'الخامس':5,'٥':5 };
  if(map[norm]!==undefined) return map[norm];
  const partials = [ [/^o?n?e?$/,'one'], [/^t(w|oo)?$/,'two'], [/^th(r|ree)?$/,'three'], [/^f(o|ou|our)?$/,'four'], [/^fi(v|ve)?$/,'five'], [/^wa?$/,'واحد'], [/^ith?n?$/,'اثنين'], [/^thl?a?$/,'ثلاثة'], [/^ar?b?$/,'أربعة'], [/^kh?m?$/,'خمسة'] ];
  for(const [re, canonical] of partials){ if(re.test(norm)) return map[canonical]; }
  for(const key in map){ if(norm.includes(key)) return map[key]; }
  return null;
}
function isYes(t){ return ['yes','yeah','yep','correct','right','نعم','ايه','أجل'].some(w=>t.includes(w)); }
function isNo(t){ return ['no','nope','nah','incorrect','wrong','لا'].some(w=>t.includes(w)); }
function parseCommand(t){
  if(['repeat','again','أعد','كرر'].some(w=>t.includes(w))) return {type:'repeat'};
  if(['undo','تراجع','رجوع'].some(w=>t.includes(w))) return {type:'undo'};
  if(['skip','تخطي','التالي'].some(w=>t.includes(w))) return {type:'skip'};
  const m = t.match(/change question (\d+)/) || t.match(/سؤال\s*(\d+)/);
  if(m) return {type:'jump', index: parseInt(m[1],10)-1};
  return null;
}
function isWakeWord(t){ return ['start survey','begin survey','ابدأ','ابدأ التقييم'].some(w=>t.includes(w)); }

function announce(msg){ const vs = voiceStatus(); if(vs) vs.textContent = msg; }
function updateProgress(){ if(!progEl()) return; if(!active){ progEl().textContent=''; return; } progEl().textContent = `Q ${Math.min(qIndex+1, QUESTIONS.length)}/${QUESTIONS.length}`; }
function updateLatency(){ if(!latencyEl() || !latencySamples.length) return; const avg = (latencySamples.reduce((a,b)=>a+b.ms,0)/latencySamples.length).toFixed(0); const last = latencySamples[latencySamples.length-1]; const label = getLang()==='ar'? 'متوسط الزمن' : 'Avg latency'; latencyEl().textContent = `${label}: ${avg}ms (Q${latencySamples.length}=${last.ms.toFixed(0)}ms)`; }

function askCurrent(force=false){ if(!active) return; pendingScore=null; awaitingConfirmation=false; const q = QUESTIONS[qIndex]; const lang = getLang(); const text = lang==='ar'? `السؤال ${qIndex+1}. ${q.text_ar}. قل رقم من 1 إلى 5.` : `Question ${qIndex+1}. ${q.text_en}. Say a number from 1 to 5.`; questionStartTime = performance.now(); speak(text,{force}); }

function recordScore(score){ setScore(QUESTIONS[qIndex].id, score); if(questionStartTime){ const ms = performance.now()-questionStartTime; latencySamples.push({qId: QUESTIONS[qIndex].id, ms}); questionStartTime=null; updateLatency(); window.__latencySamplesSent = latencySamples.slice(); }
  const lang = getLang(); announce((lang==='ar'?'سجلت':'Recorded')+' '+score); qIndex++; if(qIndex < QUESTIONS.length){ askCurrent(); } else { stopSession(); announce(lang==='ar'? 'اكتملت جميع الدرجات. راجع ثم أرسل.' : 'All scores captured. Review and submit.'); }
  updateProgress(); }

function finalizePending(){ recordScore(pendingScore); pendingScore=null; awaitingConfirmation=false; }
function confirmPending(){ const lang = getLang(); speak(lang==='ar'? `قلت ${pendingScore}؟ قل نعم أو لا.` : `You said ${pendingScore}. Say yes or no.`); announce(lang==='ar'? `تأكيد: ${pendingScore}`: `Confirm: ${pendingScore}`); }
function confirmRepeat(){ const lang = getLang(); speak(lang==='ar'? 'لم أفهم. قل نعم لتأكيد الرقم أو لا لإعادته.' : 'Did not understand. Say yes to confirm or no to retry.'); }

function handleCommand(cmd){ const lang = getLang(); if(cmd.type==='repeat'){ announce(lang==='ar'? 'إعادة السؤال.' : 'Repeating question.'); askCurrent(true); }
  if(cmd.type==='jump'){ if(cmd.index>=0 && cmd.index<QUESTIONS.length){ qIndex=cmd.index; announce(lang==='ar'? 'تغيير إلى سؤال '+(qIndex+1):'Changing to question '+(qIndex+1)); askCurrent(true);} else { announce('Invalid question number'); askCurrent(true);} }
  if(cmd.type==='undo'){ if(qIndex===0){ announce(lang==='ar'? 'لا يوجد شيء للتراجع.' : 'Nothing to undo.'); askCurrent(true); return; } qIndex=Math.max(0,qIndex-1); announce(lang==='ar'? 'تم التراجع. سؤال '+(qIndex+1):'Undone. Question '+(qIndex+1)); askCurrent(true); }
  if(cmd.type==='skip'){ announce(lang==='ar'? 'تخطي السؤال.' : 'Skipping question.'); qIndex++; if(qIndex < QUESTIONS.length){ askCurrent(true);} else { stopSession(); announce(lang==='ar'? 'انتهت الأسئلة. راجع ثم أرسل.' : 'No more questions. Review then submit.'); } }
}

function processFinalTranscript(rawText){ if(!rawText) return; const t = rawText.trim().toLowerCase();
  if(!active){ if(isWakeWord(t)){ startSession(); return; } }
  if(!active) return;
  const cmd = parseCommand(t); if(cmd){ handleCommand(cmd); return; }
  if(awaitingConfirmation){ if(isYes(t)){ finalizePending(); } else if(isNo(t)){ pendingScore=null; awaitingConfirmation=false; askCurrent(); } else { confirmRepeat(); } return; }
  const parsedScore = parseSpokenScore(t); if(parsedScore){ recordScore(parsedScore); return; }
  const lang = getLang(); speak(lang==='ar'? 'لم ألتقط رقماً. قل رقم من 1 إلى 5.' : 'Did not catch a number. Say a number from 1 to 5.', {withBeep:false}); }

function startSession(){ if(active) return; active=true; qIndex=0; latencySamples.length=0; window.__latencySamplesSent = latencySamples; const lang = getLang(); speak(lang==='ar'? 'بدء الوضع الصوتي.' : 'Starting voice mode.', {force:true}); setTimeout(()=>askCurrent(true), 300); updateProgress(); }
function stopSession(){ active=false; pendingScore=null; awaitingConfirmation=false; updateProgress(); }

export function initCommands(deps){ getLang = deps.getLang; startVoiceSession = deps.startVoiceSession || (()=>{}); stopVoiceSession = deps.stopVoiceSession || (()=>{}); window.addEventListener('survey-final-transcript', (e)=>{ processFinalTranscript(e.detail?.text); }); return { startSession, stopSession, processFinalTranscript, isActive: ()=>active, getLatency: ()=>latencySamples.slice() }; }
// Auto start question flow when voice capture starts
window.addEventListener('survey-voice-start', () => { if(!active) startSession(); });
