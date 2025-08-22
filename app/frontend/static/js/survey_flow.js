/**
 * @file Redesigned responsive voice + scoring flow (consolidated).
 * @description This module handles the primary voice-driven survey interaction, including speech recognition,
 * text-to-speech, command parsing, score recording, and latency tracking. It aims for lower latency,
 * fewer duplicate recognitions, a simpler state machine, and resilient auto-restarts.
 */

import { QUESTIONS } from './survey_config.js';
import { speak, cancelSpeak } from './survey_tts.js';
import { state } from './survey_state.js';
import { setupDOM, pushTranscript } from './survey_dom.js';

// --- Configuration ---

/**
 * If true, uses faster TTS rate and shorter delays.
 * Controlled via `localStorage.setItem('fastVoiceMode', '1')`.
 * @type {boolean}
 */
const FAST_MODE = localStorage.getItem('fastVoiceMode') === '1';

/**
 * Time window in milliseconds to suppress duplicate final transcripts.
 * @type {number}
 */
const DUP_WINDOW_MS = 5000;

/**
 * Delay in milliseconds before asking the next question.
 * @type {number}
 */
const NEXT_DELAY_MS = FAST_MODE ? 60 : 160;

// --- Internal Session State ---

let active = false;
let qIndex = 0;
let pendingScore = null;
let awaitingConfirmation = false;
let questionStartTime = null;
const latencySamples = []; // {qId, ms}

// --- Duplicate Suppression ---

const recentFinals = new Map(); // textLower -> timestamp
let lastFinal = '';
let lastFinalTime = 0;

/**
 * Checks if a transcript is a likely duplicate.
 * @param {string} txt The transcript text.
 * @returns {boolean} True if the text is a duplicate.
 */
function isDuplicate(txt) {
    const now = performance.now();
    const lower = txt.toLowerCase();
    if (lower === lastFinal && (now - lastFinalTime) < 2000) return true; // Immediate echo
    const prev = recentFinals.get(lower);
    if (prev && (now - prev) < DUP_WINDOW_MS) return true;
    return false;
}

/**
 * Registers a final transcript to prevent future duplicates.
 * @param {string} txt The transcript text.
 */
function registerFinal(txt) {
    const now = performance.now();
    lastFinal = txt.toLowerCase();
    lastFinalTime = now;
    recentFinals.set(lastFinal, now);
    // Garbage collect old entries
    if (recentFinals.size > 60) {
        const cutoff = now - DUP_WINDOW_MS;
        for (const [k, v] of recentFinals) {
            if (v < cutoff) recentFinals.delete(k);
        }
    }
}

/**
 * Collapses repeated phrases (e.g., "hello hello" -> "hello").
 * @param {string} txt The input text.
 * @returns {string} The collapsed text.
 */
function collapseRepeatPhrase(txt) {
    const m = txt.match(/^(.+?)\s+\1$/i);
    if (m) return m[1];

    const words = txt.trim().split(/\s+/);
    if (words.length > 0 && words.length % 2 === 0) {
        const half = words.length / 2;
        const first = words.slice(0, half).join(' ').toLowerCase();
        const second = words.slice(half).join(' ').toLowerCase();
        if (first === second) {
            return words.slice(0, half).join(' ');
        }
    }
    return txt;
}

// --- Score & Command Parsing ---

/**
 * A map of spoken words/phrases to numeric scores.
 * Includes common homophones and Arabic translations.
 * @type {Object<string, number>}
 */
const SCORE_MAP = {
    one: 1, '1': 1, first: 1, won: 1, 'وان': 1,
    two: 2, '2': 2, second: 2, to: 2, too: 2, 'تو': 2, 'اثنان': 2, 'اثنين': 2, 'الثاني': 2, '٢': 2,
    three: 3, '3': 3, third: 3, 'ثلاثة': 3, 'الثالث': 3, '٣': 3,
    four: 4, '4': 4, fourth: 4, for: 4, 'فور': 4, 'اربعة': 4, 'أربعة': 4, 'الرابع': 4, '٤': 4,
    five: 5, '5': 5, fifth: 5, 'فايف': 5, 'خمسة': 5, 'الخامس': 5, '٥': 5,
    'واحد': 1, 'الأول': 1, 'اول': 1, '١': 1
};

/**
 * Parses a transcript to find a numeric score (1-5).
 * @param {string} t The transcript text.
 * @returns {number|null} The parsed score or null.
 */
function parseScore(t) {
    t = t.trim().toLowerCase();
    if (SCORE_MAP[t] != null) return SCORE_MAP[t];

    const digitMatch = t.match(/\b([1-5])\b/);
    if (digitMatch) return parseInt(digitMatch[1], 10);

    const tokens = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    for (const tok of tokens) {
        if (SCORE_MAP[tok] != null) return SCORE_MAP[tok];
    }

    for (const k in SCORE_MAP) {
        if (t.includes(k)) return SCORE_MAP[k];
    }
    return null;
}

/**
 * Checks for affirmative words in a transcript.
 * @param {string} t The transcript text.
 * @returns {boolean}
 */
function isYes(t) {
    return ['yes', 'yeah', 'yep', 'correct', 'right', 'نعم', 'ايه', 'أجل'].some(w => t.includes(w));
}

/**
 * Checks for negative words in a transcript.
 * @param {string} t The transcript text.
 * @returns {boolean}
 */
function isNo(t) {
    return ['no', 'nope', 'nah', 'incorrect', 'wrong', 'لا'].some(w => t.includes(w));
}

/**
 * Parses a transcript for voice commands (repeat, undo, skip, jump).
 * @param {string} t The transcript text.
 * @returns {string|{jump: number}|null} The command, a jump object, or null.
 */
function parseCmd(t) {
    if (['repeat', 'again', 'أعد', 'كرر'].some(w => t.includes(w))) return 'repeat';
    if (['undo', 'تراجع', 'رجوع'].some(w => t.includes(w))) return 'undo';
    if (['skip', 'تخطي', 'التالي'].some(w => t.includes(w))) return 'skip';
    const m = t.match(/change question (\d+)/) || t.match(/سؤال\s*(\d+)/);
    if (m) return { jump: parseInt(m[1], 10) - 1 };
    return null;
}

/**
 * Checks for wake words to start the survey.
 * @param {string} t The transcript text.
 * @returns {boolean}
 */
function isWake(t) {
    return ['start survey', 'begin survey', 'ابدأ', 'ابدأ التقييم'].some(w => t.includes(w));
}

// --- DOM Manipulation ---

const voiceStatus = () => document.getElementById('voiceStatus');
const progressEl = () => document.getElementById('voiceProgress');
const latencyEl = () => document.getElementById('latencyStats');

/**
 * Displays a message in the voice status area.
 * @param {string} msg The message to display.
 */
function announce(msg) {
    const vs = voiceStatus();
    if (vs) vs.textContent = msg;
}

/**
 * Sets the score for a question in the DOM.
 * @param {string} qid The question ID.
 * @param {number} score The score value.
 */
function setScore(qid, score) {
    const r = document.querySelector(`input[name="${qid}"][value="${score}"]`);
    if (r) r.checked = true;
}

/**
 * Updates the progress indicator (e.g., "Q 1/10").
 */
function updateProgress() {
    if (progressEl()) {
        progressEl().textContent = active ? `Q ${Math.min(qIndex + 1, QUESTIONS.length)}/${QUESTIONS.length}` : '';
    }
}

/**
 * Updates the latency statistics display.
 */
function updateLatency() {
    if (!latencyEl() || !latencySamples.length) return;
    const avg = (latencySamples.reduce((a, b) => a + b.ms, 0) / latencySamples.length).toFixed(0);
    const last = latencySamples[latencySamples.length - 1];
    const lang = state.currentLang === 'ar';
    latencyEl().textContent = `${lang ? 'متوسط الزمن' : 'Avg latency'}: ${avg}ms (Q${latencySamples.length}=${last.ms.toFixed(0)}ms)`;
}

// --- Core Voice Flow ---

/**
 * Asks the current question using text-to-speech.
 * @param {boolean} [force=false] - If true, cancels any ongoing speech.
 */
function askCurrent(force = false) {
    if (!active) return;
    pendingScore = null;
    awaitingConfirmation = false;
    const q = QUESTIONS[qIndex];
    const lang = state.currentLang === 'ar';
    const text = lang ?
        `السؤال ${qIndex + 1}. ${q.text_ar}. قل رقم من 1 إلى 5.` :
        `Question ${qIndex + 1}. ${q.text_en}. Say a number from 1 to 5.`;
    questionStartTime = performance.now();
    speak(text, { force, rate: FAST_MODE ? 1.1 : 1.0 });
}

/**
 * Records a score, updates latency, and proceeds to the next question.
 * @param {number} score The score to record.
 */
function recordScore(score) {
    setScore(QUESTIONS[qIndex].id, score);
    if (questionStartTime) {
        const ms = performance.now() - questionStartTime;
        latencySamples.push({ qId: QUESTIONS[qIndex].id, ms });
        window.__latencySamplesSent = latencySamples.slice();
        questionStartTime = null;
        updateLatency();
    }

    const lang = state.currentLang === 'ar';
    announce((lang ? 'سجلت' : 'Recorded') + ' ' + score);
    qIndex++;

    if (qIndex < QUESTIONS.length) {
        setTimeout(() => askCurrent(), NEXT_DELAY_MS);
    } else {
        active = false;
        announce(lang ? 'اكتملت جميع الدرجات. راجع ثم أرسل.' : 'All scores captured. Review & submit.');
        updateProgress();
        cancelSpeak();
    }
    updateProgress();
}

/**
 * Main handler for final speech recognition results.
 * @param {string} raw The raw transcript from the speech engine.
 */
function handleFinalTranscript(raw) {
    if (!raw) return;
    let t = collapseRepeatPhrase(raw.trim());
    const lower = t.toLowerCase();

    if (!active) {
        if (isWake(lower)) {
            startSession();
        }
        return;
    }

    if (isDuplicate(lower)) return;
    registerFinal(lower);

    const cmd = parseCmd(lower);
    if (cmd) {
        if (cmd === 'repeat') {
            askCurrent(true);
        } else if (cmd === 'undo') {
            if (qIndex > 0) {
                qIndex--;
                askCurrent(true);
            }
        } else if (cmd === 'skip') {
            qIndex++;
            if (qIndex < QUESTIONS.length) {
                askCurrent(true);
            } else {
                active = false;
                announce(state.currentLang === 'ar' ? 'انتهت الأسئلة.' : 'No more questions.');
            }
            updateProgress();
        } else if (cmd.jump != null) {
            if (cmd.jump >= 0 && cmd.jump < QUESTIONS.length) {
                qIndex = cmd.jump;
                askCurrent(true);
            }
        }
        return;
    }

    if (awaitingConfirmation) {
        if (isYes(lower)) {
            recordScore(pendingScore);
            pendingScore = null;
            awaitingConfirmation = false;
        } else if (isNo(lower)) {
            pendingScore = null;
            awaitingConfirmation = false;
            askCurrent(true);
        } else {
            const lang = state.currentLang === 'ar';
            speak(lang ? 'لم أفهم. نعم أو لا.' : 'Did not catch. Yes or no?', { withBeep: false });
        }
        return;
    }

    const sc = parseScore(lower);
    if (sc) {
        recordScore(sc);
        return;
    }

    const lang = state.currentLang === 'ar';
    speak(lang ? 'قل رقم من واحد إلى خمسة.' : 'Say a number 1 to 5.', { withBeep: false });
}


// --- Speech Recognition Engine ---

let recog = null;
let restartTimer = null;
let backoff = 400;
const MAX_BACKOFF = 4000;
let lastPartial = ''; // Variable to track the last logged partial transcript

/**
 * Ensures the SpeechRecognition instance is created and configured.
 * @returns {SpeechRecognition|null} The recognition instance or null if unsupported.
 */
function ensureRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (recog) return recog;

    recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = state.currentLang === 'ar' ? 'ar-SA' : 'en-US';

    recog.onstart = () => {
        state.listening = true;
        state.lastStart = performance.now();
        pushTranscript('[system] recognition started');
    };

    recog.onend = () => {
        state.listening = false;
        pushTranscript('[system] recognition ended');
        scheduleRestart();
    };

    recog.onerror = (e) => {
        pushTranscript('[error] ' + e.error);
        scheduleRestart(true);
    };

    recog.onresult = (ev) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            let txt = r[0].transcript.trim();
            const op = document.getElementById('onlinePartial');

            if (!r.isFinal) {
                if (op) op.textContent = txt;
                // Only push to debug transcript if it's new content
                if (localStorage.getItem('voiceDebugVisible') === '1' && txt !== lastPartial) {
                    pushTranscript('[partial] ' + txt);
                    lastPartial = txt;
                }
                continue;
            }

            // Clear partial display and reset tracker on final result
            if (op) op.textContent = '';
            lastPartial = '';

            txt = collapseRepeatPhrase(txt);
            const lower = txt.toLowerCase();
            if (isDuplicate(lower)) continue;

            const scPreview = parseScore(lower);
            pushTranscript('[online] ' + txt + (scPreview ? ` (score? ${scPreview})` : ''));
            handleFinalTranscript(txt);
        }
    };
    return recog;
}

/**
 * Schedules a restart of the recognition engine with exponential backoff on error.
 * @param {boolean} [isError=false] - Whether the restart is due to an error.
 */
function scheduleRestart(isError = false) {
    if (!active) return;
    if (restartTimer) clearTimeout(restartTimer);
    backoff = isError ? Math.min(backoff * 1.6, MAX_BACKOFF) : 400;
    restartTimer = setTimeout(() => {
        try {
            recog && recog.start();
        } catch (_) {
            // Silently ignore errors, will retry on next schedule
        }
    }, backoff);
}

/**
 * Starts the speech recognition engine.
 */
function startListening() {
    const r = ensureRecognition();
    if (!r) {
        announce('Speech API unsupported');
        return;
    }
    try {
        r.start();
    } catch (_) {
        // Fails if already started, which is fine.
    }
}

/**
 * Stops the speech recognition engine.
 */
function stopListening() {
    if (recog) {
        try {
            recog.stop();
        } catch (_) {
            // Fails if already stopped, which is fine.
        }
    }
}

// --- Public API & Initialization ---

/**
 * Starts a new voice-driven survey session.
 */
function startSession() {
    if (active) return;
    active = true;
    qIndex = 0;
    latencySamples.length = 0;
    window.__latencySamplesSent = latencySamples;
    updateProgress();
    const lang = state.currentLang === 'ar';
    speak(lang ? 'بدء الوضع الصوتي.' : 'Starting voice mode.', { force: true });
    setTimeout(() => askCurrent(true), FAST_MODE ? 120 : 300);
    startListening();
}

/**
 * Toggles the voice mode on and off.
 */
function toggleVoice() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (!active) {
        startSession();
        if (voiceBtn) {
            voiceBtn.dataset.mode = 'on';
            voiceBtn.textContent = 'Stop Voice';
        }
    } else {
        active = false;
        stopListening();
        if (voiceBtn) {
            voiceBtn.dataset.mode = 'off';
            voiceBtn.textContent = 'Voice Mode';
        }
        announce('Voice stopped');
    }
}

/**
 * Initializes the entire voice flow, sets up event listeners, and exposes state.
 */
export function initFlow() {
    setupDOM();

    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.removeEventListener('click', toggleVoice);
        voiceBtn.addEventListener('click', toggleVoice);
    }

    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            state.currentLang = state.currentLang === 'en' ? 'ar' : 'en';
            if (recog) {
                recog.lang = state.currentLang === 'ar' ? 'ar-SA' : 'en-US';
            }
            langBtn.textContent = state.currentLang.toUpperCase();
            const lang = state.currentLang === 'ar';
            speak(lang ? 'تم اختيار العربية' : 'English selected', { withBeep: false });
        });
    }

    // Expose for other modules (e.g., survey_main getLang)
    window.state = state;
}
