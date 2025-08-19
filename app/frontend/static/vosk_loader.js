// Lightweight Vosk WASM loader scaffold
// Assumes you place model files under /static/vosk-model (small model recommended)
// This is a simplified pattern; real-world usage may stream audio frames to the recognizer.

(function(){
  // Base path containing language model subfolders (en, ar) or a flat small model.
  // Expected structure if multilingual:
  // /static/vosk-model/en/...model files...
  // /static/vosk-model/ar/...model files...
  // If only English model present, keep files directly under vosk-model and code will fallback.
  const ROOT_BASE = '/static/vosk-model';
  let currentLang = 'en';
  let recognizer = null;
  let model = null;
  let ready = false;
  let config = { onPartial:()=>{}, onResult:()=>{}, wakeWord:()=>{} };
  let audioCtx, processor, micSrc, workletNode;
  const SAMPLE_RATE = 16000;
  let enabled = false;
  let frameQueue = [];
  let batchTimer = null;
  let currentModelPath = null;
  let lastCPUCheck = performance.now();
  let batchIntervalMs = 160; // adaptive
  let cpuLoadEMA = 0; // exponential moving average of processing time ratio
  const cpuAlpha = 0.2;
  let lastBatchStart = 0;

  // Adaptive buffer downsampling
  function downsample(buffer, inRate, outRate){
    if(inRate === outRate) return buffer;
    const ratio = inRate / outRate;
    const newLen = Math.round(buffer.length / ratio);
    const out = new Float32Array(newLen);
    let offset = 0;
    for(let i=0;i<newLen;i++){
      const start = Math.round(i * ratio);
      const end = Math.round((i+1)*ratio);
      let sum = 0; let count = 0;
      for(let j=start;j<end && j<buffer.length;j++){ sum += buffer[j]; count++; }
      out[i] = count? (sum/count):0;
    }
    return out;
  }

  async function initAudio(){
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    micSrc = audioCtx.createMediaStreamSource(stream);
    const useWorklet = !!audioCtx.audioWorklet;
    if(useWorklet){
      try {
        await audioCtx.audioWorklet.addModule('/static/vosk_worklet_processor.js');
        workletNode = new AudioWorkletNode(audioCtx, 'vosk-audio-processor');
        workletNode.port.onmessage = (ev)=>{
          if(ev.data && ev.data.type === 'audio-chunk'){
            if(!ready || !enabled) return;
            const input = ev.data.samples;
            const ds = downsample(input, audioCtx.sampleRate, SAMPLE_RATE);
            const pcm16 = new Int16Array(ds.length);
            for(let i=0;i<ds.length;i++){ let s = Math.max(-1, Math.min(1, ds[i])); pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
            frameQueue.push(pcm16);
          }
        };
        micSrc.connect(workletNode).connect(audioCtx.destination);
      } catch(err){
        console.warn('[VOSK] Worklet failed, falling back to ScriptProcessor', err);
        setupScriptProcessor();
      }
    } else {
      setupScriptProcessor();
    }
  if(!batchTimer){ batchTimer = setInterval(processBatch, batchIntervalMs); }
  }

  function setupScriptProcessor(){
    processor = audioCtx.createScriptProcessor(8192, 1, 1);
    micSrc.connect(processor);
    processor.connect(audioCtx.destination);
    processor.onaudioprocess = (e) => {
      if(!ready || !enabled) return;
      const input = e.inputBuffer.getChannelData(0);
      const ds = downsample(input, audioCtx.sampleRate, SAMPLE_RATE);
      const pcm16 = new Int16Array(ds.length);
      for(let i=0;i<ds.length;i++){ let s = Math.max(-1, Math.min(1, ds[i])); pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
      frameQueue.push(pcm16);
    };
  }

  function processBatch(){
    if(!enabled || !ready || !recognizer) return;
    if(!frameQueue.length) return;
    lastBatchStart = performance.now();
    // Concatenate queued frames
    let total = 0; for(const f of frameQueue) total += f.length;
    const merged = new Int16Array(total);
    let offset = 0; for(const f of frameQueue){ merged.set(f, offset); offset += f.length; }
    frameQueue.length = 0;
    const res = recognizer.acceptWaveform(merged);
    if(res){
      const r = recognizer.result();
      if(r && r.text){ config.onResult(r.text); }
    } else {
      const p = recognizer.partialResult();
      if(p && p.partial){ config.onPartial(p.partial); }
    }
    adaptCPU();
  }

  function adaptCPU(){
    const now = performance.now();
    const batchDur = now - lastBatchStart;
    const ratio = batchDur / batchIntervalMs; // >1 means overtime
    cpuLoadEMA = cpuLoadEMA ? (cpuLoadEMA * (1-cpuAlpha) + ratio * cpuAlpha) : ratio;
    // Increase interval if consistently heavy
    if(cpuLoadEMA > 0.9 && batchIntervalMs < 400){
      batchIntervalMs += 40;
      resetBatchTimer();
    } else if(cpuLoadEMA < 0.35 && batchIntervalMs > 120){
      batchIntervalMs -= 20;
      resetBatchTimer();
    }
    window.dispatchEvent(new CustomEvent('vosk-cpu', {detail:{interval: batchIntervalMs, load: cpuLoadEMA}}));
  }

  function resetBatchTimer(){
    if(batchTimer){ clearInterval(batchTimer); }
    batchTimer = setInterval(processBatch, batchIntervalMs);
  }

  function detectLang(){
    try {
      // Try to read app voice language from localStorage set elsewhere (en/ar)
      const stored = localStorage.getItem('voiceLang');
      if(stored) currentLang = stored;
    } catch(_){}
  }

  function resolveModelPath(){
    // Prefer language subfolder if exists, else root
    const langPath = ROOT_BASE + '/' + currentLang;
    // We cannot synchronously test existence; assume structure deployed by user.
    return langPath; // user must create subfolder for second language
  }

  async function loadWASM(){
    if(!window.Vosk){ console.warn('Vosk WASM not loaded (add script tag for vosk wasm bundle)'); return; }
    detectLang();
    const modelPath = resolveModelPath();
    try {
      model = new Vosk.Model(modelPath);
    } catch(err){
      console.warn('[VOSK] Failed loading language path', modelPath, 'falling back to root:', err);
      try { model = new Vosk.Model(ROOT_BASE); } catch(e2){ 
        console.error('[VOSK] Could not load any model', e2);
        window.dispatchEvent(new CustomEvent('vosk-error', {detail:{type:'model-load', error: e2?.message || 'unknown'}}));
        return; }
    }
    try {
      recognizer = new Vosk.Recognizer({model, sampleRate: SAMPLE_RATE});
    } catch(e3){ console.error('[VOSK] Recognizer init failed', e3); window.dispatchEvent(new CustomEvent('vosk-error', {detail:{type:'recognizer-init', error: e3?.message || 'unknown'}})); return; }
    ready = true;
    currentModelPath = modelPath;
  console.log('[VOSK] Ready (lang='+currentLang+', path='+modelPath+')');
  window.dispatchEvent(new CustomEvent('vosk-ready', {detail:{lang: currentLang, path: modelPath}}));
  }

  window.initVosk = function(userConfig){
    Object.assign(config, userConfig||{});
    (async () => {
      try {
        await initAudio();
        await loadWASM();
      } catch(err){ console.warn('Vosk init failed:', err); }
    })();
  };

  async function reloadLanguage(newLang){
    if(newLang === currentLang && ready) return;
    currentLang = newLang;
    ready = false;
    frameQueue.length = 0;
    try { if(recognizer){ recognizer.free && recognizer.free(); } } catch(_){ }
    recognizer = null; model = null;
    await loadWASM();
  }

  function enable(){ enabled = true; }
  function disable(){ enabled = false; frameQueue.length = 0; }
  function isReady(){ return ready; }

  window.VoskController = { enable, disable, isReady, setLanguage: reloadLanguage, isEnabled:()=>enabled };

  // Allow external retry without recreating audio context
  window.addEventListener('vosk-retry', async () => {
    if(ready) return; // already ready
    try {
      await loadWASM();
    } catch(err){
      console.warn('[VOSK] Retry failed', err);
      window.dispatchEvent(new CustomEvent('vosk-error', {detail:{type:'retry-failed', error: err?.message || 'unknown'}}));
    }
  });
})();
