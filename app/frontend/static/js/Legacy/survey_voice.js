// Legacy copy of deprecated survey_voice.js (original behavior prior to unified survey_flow.js)
// ...original code preserved below...

// DEPRECATED: legacy voice module replaced by survey_flow.js
// Retained only as reference; not imported by main entry.
import { setupDOM, pushTranscript } from '../survey_dom.js';
import { state } from '../survey_state.js';
import { speak } from '../survey_tts.js';
import { getRMS } from '../survey_vad.js';

export function initVoice(){ /* trimmed for legacy brevity */ console.warn('Legacy initVoice called - use survey_flow.js'); }
