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
  if(!DISABLE_TRANSCRIPT_DEBUG){ 
    ensurePanel(); 
    setupDebugToggle();
  }
}

// Add debug panel toggle functionality
function setupDebugToggle() {
  // Keyboard shortcut: Ctrl + Shift + D to toggle debug panel
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      toggleDebugPanel();
    }
    // Escape key to close debug panel
    if (e.key === 'Escape') {
      const panel = document.getElementById('dbgPanel');
      if (panel && localStorage.getItem('voiceDebugVisible') === '1') {
        e.preventDefault();
        toggleDebugPanel();
      }
    }
  });
}

export function toggleDebugPanel() {
  const panel = document.getElementById('dbgPanel');
  if (!panel) return;
  
  const isVisible = localStorage.getItem('voiceDebugVisible') === '1';
  
  if (!isVisible) {
    // Show panel
    localStorage.setItem('voiceDebugVisible', '1');
    panel.style.display = 'block';
    setTimeout(() => {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    }, 10);
  } else {
    // Hide panel
    localStorage.setItem('voiceDebugVisible', '0');
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(5px)';
    setTimeout(() => {
      panel.style.display = 'none';
    }, 300);
  }
}

export function pushTranscript(line){
  if(DISABLE_TRANSCRIPT_DEBUG) return;
  ensurePanel();
  const dbgLines = document.getElementById('dbgLines');
  if(!dbgLines) return; // still missing
  
  window.__voiceDbgBuffer.push(line);
  if(window.__voiceDbgBuffer.length > BUFFER_MAX) {
    window.__voiceDbgBuffer = window.__voiceDbgBuffer.slice(-BUFFER_MAX);
  }
  
  // Style different types of transcript lines
  const styledLines = window.__voiceDbgBuffer.map(l => {
    const cleanLine = l.replace(/[<>]/g, '');
    let color = '#ffffff';
    let icon = '';
    
    if (cleanLine.includes('[system]')) {
      color = '#22d3ee'; // cyan for system messages
      icon = '🔧 ';
    } else if (cleanLine.includes('[error]')) {
      color = '#ef4444'; // red for errors
      icon = '❌ ';
    } else if (cleanLine.includes('[final]')) {
      color = '#10b981'; // green for final transcripts
      icon = '✓ ';
    } else if (cleanLine.includes('Processing:')) {
      color = '#3b82f6'; // blue for processing
      icon = '⚡ ';
    } else {
      color = '#d1d5db'; // gray for other messages
      icon = '💬 ';
    }
    
    return `<div style="color: ${color}; margin-bottom: 2px; font-size: 0.65rem;">${icon}${cleanLine}</div>`;
  }).join('');
  
  dbgLines.innerHTML = styledLines;
  
  // Auto-scroll to bottom
  dbgLines.scrollTop = dbgLines.scrollHeight;
  
  // Auto show if user previously enabled or first time open state just turned on
  const panel = document.getElementById('dbgPanel');
  if(panel && localStorage.getItem('voiceDebugVisible') === '1') {
    panel.style.display = 'block';
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }
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
  
  // Create floating transparent overlay in bottom-left corner
  panel.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    width: 320px;
    max-height: 200px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.8rem;
    z-index: 9999;
    font: 11px/1.35 'Consolas', 'Monaco', monospace;
    color: #ffffff;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(5px);
  `;
  
  panel.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.5rem;">
      <strong style="font-size: 0.65rem; letter-spacing: 0.8px; color: #22d3ee;">VOICE DEBUG</strong>
      <div style="display: flex; gap: 0.4rem; align-items: center; font-size: 0.55rem;">
        <span id="dbgCount" style="color: rgba(255, 255, 255, 0.7);"></span>
        <button type="button" id="dbgClear" style="
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          font-size: 0.55rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
        ">Clear</button>
        <button type="button" id="dbgToggle" style="
          background: rgba(220, 38, 38, 0.8);
          color: #ffffff;
          border: 1px solid rgba(220, 38, 38, 0.5);
          padding: 2px 6px;
          font-size: 0.55rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
        ">×</button>
      </div>
    </div>
    <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 0 0 0.5rem 0;"/>
    <div id="dbgLines" style="
      max-height: 120px;
      overflow-y: auto;
      font-size: 0.65rem;
      line-height: 1.4;
      padding-right: 4px;
    "></div>
  `;
  
  // Append to body for proper floating behavior
  document.body.appendChild(panel);
  
  const saved = localStorage.getItem('voiceDebugVisible') === '1';
  panel.style.display = saved ? 'block' : 'none';
  if (saved) {
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }
  
  // Clear button functionality
  panel.querySelector('#dbgClear').addEventListener('click', () => {
    window.__voiceDbgBuffer = [];
    document.getElementById('dbgLines').innerHTML = '';
    updateCount();
  });
  
  // Close button functionality
  panel.querySelector('#dbgToggle').addEventListener('click', () => {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(5px)';
    setTimeout(() => {
      panel.style.display = 'none';
      localStorage.setItem('voiceDebugVisible', '0');
    }, 300);
  });
  
  // Hover effects for buttons
  const buttons = panel.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn.id === 'dbgClear') {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
      } else {
        btn.style.background = 'rgba(220, 38, 38, 1)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.id === 'dbgClear') {
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
      } else {
        btn.style.background = 'rgba(220, 38, 38, 0.8)';
      }
    });
  });
  
  // Sync display when external toggle event received
  window.addEventListener('toggle-transcript-debug', () => {
    const desired = localStorage.getItem('voiceDebugVisible') === '1';
    if (desired) {
      panel.style.display = 'block';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    } else {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(5px)';
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    }
  });
}
