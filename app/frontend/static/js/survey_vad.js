// Voice Activity Detection + VU meter canvas
let analyser, audioCtx, micSrc, canvas, ctx;
let currentRMS = 0; let noiseFloorEMA = 0.005; let threshold = 0.01;
const BARS = 32;

export function initVAD(){
  if(canvas) return;
  canvas = document.createElement('canvas');
  canvas.width = 180; canvas.height = 40; canvas.id='voiceVu'; canvas.className='voice-vu';
  const actionsRow = document.querySelector('.inline-actions');
  if(actionsRow){ actionsRow.appendChild(canvas); } else { document.body.appendChild(canvas); }
  ctx = canvas.getContext('2d');
  tryInit();
  setInterval(adaptThreshold, 400);
}

async function tryInit(){
  if(!navigator.mediaDevices) return;
  try {
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    micSrc = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser(); analyser.fftSize=2048; micSrc.connect(analyser);
    requestAnimationFrame(draw);
  } catch(err){ console.warn('VAD init failed', err); }
}

function draw(){
  if(!analyser){ requestAnimationFrame(draw); return; }
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='var(--bg-alt)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  let sum=0; for(let i=0;i<data.length;i++){ const v=(data[i]-128)/128; sum += v*v; }
  currentRMS = Math.sqrt(sum / data.length);
  const step = Math.floor(data.length/BARS);
  for(let i=0;i<BARS;i++){
    const v = (data[i*step]-128)/128;
    const h = Math.max(2, Math.abs(v)*canvas.height);
    const x = (i/BARS)*canvas.width;
    ctx.fillStyle = currentRMS < threshold? 'var(--border)':'var(--accent)';
    ctx.fillRect(x, (canvas.height-h)/2, canvas.width/BARS - 2, h);
  }
  canvas.style.opacity = currentRMS < threshold? 0.45:1;
  requestAnimationFrame(draw);
}

function adaptThreshold(){
  if(currentRMS < threshold){ noiseFloorEMA = noiseFloorEMA * 0.95 + currentRMS * 0.05; threshold = Math.min(0.05, Math.max(0.005, noiseFloorEMA*3.2)); }
}

export function getRMS(){ return currentRMS; }
export function getThreshold(){ return threshold; }
