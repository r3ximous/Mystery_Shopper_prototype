import { MAX_DEBUG_LINES } from './survey_config.js';

// Set to true to disable transcript capture entirely (quick kill-switch)
const DISABLE_TRANSCRIPT_DEBUG = false; // flip to true to remove from debug mode
const BUFFER_MAX = MAX_DEBUG_LINES;
if(!window.__voiceDbgBuffer) window.__voiceDbgBuffer = [];
// Ensure a toggle before voice init still creates panel
window.addEventListener('toggle-transcript-debug', () => { if(!DISABLE_TRANSCRIPT_DEBUG) ensurePanel(); });

export function setupDOM(){
  const voiceStatus = document.getElementById('voiceStatus');
  // create partial containers if not present
  if(!document.getElementById('onlinePartial')){
    const onlinePartial = document.createElement('div');
    onlinePartial.id='onlinePartial';
    onlinePartial.className='voice-partial online';
    voiceStatus.parentElement.appendChild(onlinePartial);
  }
  if(!document.getElementById('voiceProgress')){
    const prog = document.createElement('div');
    prog.id = 'voiceProgress';
    prog.className = 'voice-progress';
    voiceStatus.parentElement.appendChild(prog);
  }
  if(!document.getElementById('latencyStats')){
    const lat = document.createElement('div');
    lat.id = 'latencyStats';
    lat.className = 'voice-progress';
    voiceStatus.parentElement.appendChild(lat);
  }
  if(!DISABLE_TRANSCRIPT_DEBUG){ ensurePanel(); }
}

export function pushTranscript(line){
  if(DISABLE_TRANSCRIPT_DEBUG) return;
  ensurePanel();
  const dbgLines = document.getElementById('dbgLines');
  if(!dbgLines) return; // still missing
  window.__voiceDbgBuffer.push(line);
  if(window.__voiceDbgBuffer.length > BUFFER_MAX) window.__voiceDbgBuffer = window.__voiceDbgBuffer.slice(-BUFFER_MAX);
  dbgLines.innerHTML = window.__voiceDbgBuffer.map(l=>`<div>${l.replace(/[<>]/g,'')}</div>`).join('');
  // Auto show if user previously enabled or first time open state just turned on
  const panel = document.getElementById('dbgPanel');
  if(panel && localStorage.getItem('voiceDebugVisible') === '1') panel.style.display='block';
  updateCount();
}

function updateCount(){
  const c = document.getElementById('dbgCount');
  const box = document.getElementById('dbgLines');
  if(!c || !box) return;
  c.textContent = box.children.length + ' lines';
}

function ensurePanel(){
  if(document.getElementById('dbgPanel')) return;
  const panel = document.createElement('div');
  panel.id='dbgPanel';
  panel.style.cssText='margin-top:1rem;border:1px solid var(--border);background:var(--card);padding:.6rem .7rem;border-radius:6px;max-height:180px;overflow:auto;font:11px/1.35 monospace;display:none;';
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;"> <strong style="font-size:.65rem;letter-spacing:.8px;">TRANSCRIPTS</strong><div style="display:flex;gap:.4rem;align-items:center;font-size:.55rem;"> <span id="dbgCount" style="color:var(--text-dim);"></span> <button type="button" id="dbgClear" style="background:#232a33;padding:2px 6px;font-size:.55rem;border-radius:4px;">Clear</button></div></div><hr style="border:0;border-top:1px solid var(--border);margin:.4rem 0 .5rem"/><div id="dbgLines"></div>';
  const result = document.getElementById('result');
  if(result && result.parentElement){ result.parentElement.appendChild(panel); }
  else { document.body.appendChild(panel); }
  const saved = localStorage.getItem('voiceDebugVisible') === '1';
  panel.style.display = saved ? 'block':'none';
  panel.querySelector('#dbgClear').addEventListener('click', ()=>{ window.__voiceDbgBuffer = []; document.getElementById('dbgLines').innerHTML=''; updateCount(); });
  // Sync display when external toggle event received (new contract: localStorage already updated by trigger)
  window.addEventListener('toggle-transcript-debug', ()=>{
    const desired = localStorage.getItem('voiceDebugVisible') === '1';
    panel.style.display = desired ? 'block':'none';
  });
}
