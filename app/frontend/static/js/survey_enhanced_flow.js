/**
 * @file Enhanced Voice Flow for Comprehensive Survey
 * @description Handles voice recognition for all question types (rating, yes/no, multiple choice)
 * with category navigation, progress tracking, and multilingual support
 */

import { QUESTIONS, VOICE_COMMANDS, SCORE_MAP, QUESTION_TYPES, VOICE_MESSAGES } from './survey_config.js';
import { speak, cancelSpeak } from './survey_tts.js';
import { state } from './survey_state.js';
import { setupDOM, pushTranscript } from './survey_dom.js';

// --- Enhanced State Management ---
const voiceState = {
  active: false,
  listening: false,
  currentQuestionIndex: 0,
  currentCategoryIndex: 0,
  categories: [],
  questionsInCategory: [],
  awaitingConfirmation: false,
  pendingAnswer: null,
  latencySamples: [],
  questionStartTime: 0,
  sessionStartTime: 0,
  lastProcessTime: 0  // Add debouncing
};

// Speech Recognition variables
let recog = null;
let restartTimer = null;
let backoff = 400;
const MAX_BACKOFF = 4000;
const FAST_MODE = localStorage.getItem('fastVoiceMode') === '1';
const DUP_WINDOW_MS = 3000;
const recentFinals = [];

// --- Voice UI Helper Functions ---
function updateVoiceStatus(message, type = 'info') {
  const statusElement = document.getElementById('voiceStatus');
  if (!statusElement) return;
  
  // Clear any existing timeout
  if (updateVoiceStatus.timeout) {
    clearTimeout(updateVoiceStatus.timeout);
  }
  
  // Update status with color coding
  statusElement.textContent = message;
  statusElement.className = `voice-status ${type}`;
  
  // Auto-clear status after delay (except for persistent states)
  if (type !== 'listening' && type !== 'active') {
    updateVoiceStatus.timeout = setTimeout(() => {
      if (voiceState.active) {
        statusElement.textContent = voiceState.listening ? 'Listening...' : 'Voice active';
        statusElement.className = 'voice-status active';
      } else {
        statusElement.textContent = 'Voice idle';
        statusElement.className = 'voice-status';
      }
    }, 2000);
  }
}

// --- Initialization ---
export function initEnhancedFlow() {
  setupDOM();
  initializeCategories();
  setupEventListeners();
  window.enhancedVoiceState = voiceState;
}

function initializeCategories() {
  if (!QUESTIONS || QUESTIONS.length === 0) {
    console.warn('No questions available for voice mode');
    return;
  }
  
  // Group questions by category
  const categoryMap = {};
  QUESTIONS.forEach((question, index) => {
    const category = question.category || 'General';
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push({ ...question, originalIndex: index });
  });
  
  voiceState.categories = Object.keys(categoryMap).map(name => ({
    name,
    questions: categoryMap[name]
  }));
  
  if (voiceState.categories.length > 0) {
    voiceState.questionsInCategory = voiceState.categories[0].questions;
  }
}

function setupEventListeners() {
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.removeEventListener('click', toggleVoiceMode);
    voiceBtn.addEventListener('click', toggleVoiceMode);
  }
  
  // Add voice access buttons throughout the form
  addVoiceAccessButtons();
}

function addVoiceAccessButtons() {
  // Add floating voice button for easy access
  const floatingBtn = document.createElement('button');
  floatingBtn.id = 'floatingVoiceBtn';
  floatingBtn.type = 'button';
  floatingBtn.className = 'floating-voice-btn';
  floatingBtn.innerHTML = '🎤';
  floatingBtn.title = 'Toggle Voice Mode';
  floatingBtn.addEventListener('click', toggleVoiceMode);
  
  // Add to body for global access
  document.body.appendChild(floatingBtn);
  
  // Add voice buttons to each category section
  const categorySections = document.querySelectorAll('.category-section');
  categorySections.forEach((section, index) => {
    const header = section.querySelector('.section-header');
    if (header) {
      const categoryVoiceBtn = document.createElement('button');
      categoryVoiceBtn.type = 'button';
      categoryVoiceBtn.className = 'category-voice-btn secondary-btn';
      categoryVoiceBtn.innerHTML = '🎤 Voice';
      categoryVoiceBtn.title = 'Start voice mode for this category';
      categoryVoiceBtn.addEventListener('click', () => startCategoryVoice(index));
      header.appendChild(categoryVoiceBtn);
    }
  });
}

// --- Enhanced Voice Commands ---
function parseVoiceCommand(transcript) {
  const lower = transcript.toLowerCase();
  
  // Check all command types
  for (const [commandType, patterns] of Object.entries(VOICE_COMMANDS)) {
    if (patterns.some(pattern => lower.includes(pattern.toLowerCase()))) {
      return commandType;
    }
  }
  
  return null;
}

function parseAnswer(transcript, questionType) {
  const lower = transcript.toLowerCase();
  
  switch (questionType) {
    case QUESTION_TYPES.RATING:
      return parseScore(lower);
      
    case QUESTION_TYPES.YES_NO:
      // Check both English and Arabic yes/no responses
      const yesWords = ['yes', 'yeah', 'yep', 'نعم', 'أيوه', 'ايوه', 'اه', 'طبعا', 'اكيد'];
      const noWords = ['no', 'nope', 'nah', 'لا', 'لأ', 'مش', 'عدم', 'ابدا'];
      
      for (const word of yesWords) {
        if (lower.includes(word)) return 'yes';
      }
      for (const word of noWords) {
        if (lower.includes(word)) return 'no';
      }
      return null;
      
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      // Try to parse numeric choice first
      const score = parseScore(lower);
      if (score) return score;
      
      // Try to match option text by checking current question options
      const currentQuestion = QUESTIONS[state.currentQuestion];
      if (currentQuestion && currentQuestion.options) {
        for (let i = 0; i < currentQuestion.options.length; i++) {
          const option = currentQuestion.options[i];
          const optionTextEn = option.en ? option.en.toLowerCase() : '';
          const optionTextAr = option.ar ? option.ar.toLowerCase() : '';
          
          // Check if transcript contains key words from either language option
          if ((optionTextEn && lower.includes(optionTextEn.substring(0, Math.min(optionTextEn.length, 10)))) ||
              (optionTextAr && lower.includes(optionTextAr.substring(0, Math.min(optionTextAr.length, 10))))) {
            return (i + 1).toString(); // Return 1-based index as string
          }
        }
      }
      return null;
      
    default:
      return parseScore(lower);
  }
}

function parseScore(text) {
  // Arabic number words to digits mapping
  const arabicNumbers = {
    'واحد': '1', 'اثنين': '2', 'ثلاثة': '3', 'أربعة': '4', 'خمسة': '5',
    'وحده': '1', 'اتنين': '2', 'تلاته': '3', 'اربعه': '4', 'خمسه': '5'
  };
  
  // Replace Arabic number words with digits
  let processedText = text;
  for (const [word, digit] of Object.entries(arabicNumbers)) {
    processedText = processedText.replace(new RegExp(word, 'g'), digit);
  }
  
  // Enhanced score mapping with multilingual support
  const multilingualScoreMap = {
    // English expressions
    'excellent': '5', 'perfect': '5', 'outstanding': '5', 'amazing': '5', 'fantastic': '5',
    'great': '4', 'good': '4', 'very good': '4', 'nice': '4', 'pretty good': '4',
    'okay': '3', 'average': '3', 'fine': '3', 'medium': '3', 'neutral': '3', 'so-so': '3',
    'poor': '2', 'bad': '2', 'not good': '2', 'below average': '2', 'disappointing': '2',
    'terrible': '1', 'awful': '1', 'horrible': '1', 'very bad': '1', 'worst': '1',
    
    // Arabic expressions
    'ممتاز': '5', 'رائع': '5', 'جيد جداً': '5', 'عظيم': '5', 'مدهش': '5',
    'جيد': '4', 'كويس': '4', 'حلو': '4', 'مقبول جداً': '4', 'جميل': '4',
    'عادي': '3', 'متوسط': '3', 'مش بطال': '3', 'عام': '3', 'وسط': '3',
    'سيئ': '2', 'مش كويس': '2', 'ضعيف': '2', 'مش حلو': '2', 'مقبول': '2',
    'فظيع': '1', 'وحش': '1', 'سيئ جداً': '1', 'مقرف': '1', 'الأسوأ': '1'
  };
  
  // Check for qualitative expressions first
  for (const [phrase, score] of Object.entries(multilingualScoreMap)) {
    if (processedText.includes(phrase)) {
      return parseInt(score);
    }
  }
  
  // Enhanced score mapping from config (fallback to original)
  for (const [word, score] of Object.entries(SCORE_MAP)) {
    if (processedText.includes(word.toLowerCase())) {
      return score;
    }
  }
  
  // Try regex for isolated numbers (1-5)
  const numMatch = processedText.match(/\b([1-5])\b/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  
  return null;
}

// --- Question Navigation ---
function getCurrentQuestion() {
  if (voiceState.questionsInCategory.length === 0) return null;
  return voiceState.questionsInCategory[voiceState.currentQuestionIndex];
}

function moveToNextQuestion() {
  voiceState.currentQuestionIndex++;
  
  if (voiceState.currentQuestionIndex >= voiceState.questionsInCategory.length) {
    // Move to next category
    return moveToNextCategory();
  }
  
  return true;
}

function moveToPreviousQuestion() {
  voiceState.currentQuestionIndex--;
  
  if (voiceState.currentQuestionIndex < 0) {
    // Move to previous category
    return moveToPreviousCategory();
  }
  
  return true;
}

function moveToNextCategory() {
  voiceState.currentCategoryIndex++;
  
  if (voiceState.currentCategoryIndex >= voiceState.categories.length) {
    // Survey completed
    completeSurvey();
    return false;
  }
  
  voiceState.questionsInCategory = voiceState.categories[voiceState.currentCategoryIndex].questions;
  voiceState.currentQuestionIndex = 0;
  
  const lang = state.currentLang === 'ar';
  const categoryName = voiceState.categories[voiceState.currentCategoryIndex].name;
  speak(lang ? 
    `${VOICE_MESSAGES.ar.CATEGORY_CHANGED}: ${categoryName}` :
    `${VOICE_MESSAGES.en.CATEGORY_CHANGED}: ${categoryName}`,
    { withBeep: false }
  );
  
  return true;
}

function moveToPreviousCategory() {
  voiceState.currentCategoryIndex--;
  
  if (voiceState.currentCategoryIndex < 0) {
    voiceState.currentCategoryIndex = 0;
    voiceState.currentQuestionIndex = 0;
    return false;
  }
  
  voiceState.questionsInCategory = voiceState.categories[voiceState.currentCategoryIndex].questions;
  voiceState.currentQuestionIndex = voiceState.questionsInCategory.length - 1;
  
  return true;
}

// --- Question Asking ---
function askCurrentQuestion(force = false) {
  const question = getCurrentQuestion();
  if (!question) {
    completeSurvey();
    return;
  }
  
  // Auto-detect language based on current interface language or provide both
  const currentDisplayLang = state.currentLang || 'en';
  const isArabicInterface = currentDisplayLang === 'ar';
  
  // Always provide instruction in both languages for better accessibility
  let questionText = '';
  
  if (isArabicInterface) {
    // Arabic interface - prioritize Arabic
    questionText = `السؤال ${voiceState.currentQuestionIndex + 1}. ${question.text_ar || question.text_en}. `;
    
    switch (question.question_type) {
      case QUESTION_TYPES.YES_NO:
        questionText += 'قل نعم أو لا';
        break;
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        questionText += 'اختر خيار';
        break;
      default:
        questionText += 'قيم من 1 إلى 5 نجوم';
    }
  } else {
    // English interface - prioritize English
    questionText = `Question ${voiceState.currentQuestionIndex + 1}. ${question.text_en}. `;
    
    switch (question.question_type) {
      case QUESTION_TYPES.YES_NO:
        questionText += 'Say yes or no';
        break;
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        questionText += 'Choose an option';
        break;
      default:
        questionText += 'Rate from 1 to 5 stars';
    }
  }
  
  voiceState.questionStartTime = performance.now();
  
  // Use appropriate TTS language based on the text content
  const ttsLang = isArabicInterface ? 'ar' : 'en';
  speak(questionText, { force, rate: FAST_MODE ? 1.1 : 1.0, lang: ttsLang });
  
  // Update progress display
  updateVoiceProgress();
}

// --- Answer Processing ---
function recordAnswer(answer, questionType) {
  const question = getCurrentQuestion();
  if (!question) return;
  
  // Find the form input and set it
  const questionId = question.id;
  let inputValue = answer;
  
  // Convert answer based on question type
  if (questionType === QUESTION_TYPES.YES_NO) {
    // Find the yes/no options and their values
    const yesInput = document.querySelector(`input[name="${questionId}"][value="1"]`) ||
                    document.querySelector(`input[name="${questionId}"][value="5"]`);
    const noInput = document.querySelector(`input[name="${questionId}"][value="0"]`) ||
                   document.querySelector(`input[name="${questionId}"][value="1"]`);
    
    if (answer === 'yes' && yesInput) {
      inputValue = yesInput.value;
    } else if (answer === 'no' && noInput) {
      inputValue = noInput.value;
    }
  }
  
  // Set the form input
  const input = document.querySelector(`input[name="${questionId}"][value="${inputValue}"]`);
  if (input) {
    input.checked = true;
    
    // Trigger the selection visual feedback
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      // Remove selected from siblings
      const siblingLabels = document.querySelectorAll(`label[for^="${questionId}_"]`);
      siblingLabels.forEach(sibling => sibling.classList.remove('selected'));
      
      // Add selected to this label
      label.classList.add('selected');
    }
    
    // Trigger change event for progress tracking
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Record latency
  const responseTime = performance.now() - voiceState.questionStartTime;
  voiceState.latencySamples.push({
    question_id: questionId,
    qId: questionId,
    latencyMs: Math.round(responseTime)
  });
  
  // Announce confirmation
  const lang = state.currentLang === 'ar';
  const messages = lang ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
  speak(messages.SCORE_CONFIRMED, { withBeep: false, rate: 1.3 });
  
  // Move to next question after brief delay
  setTimeout(() => {
    if (moveToNextQuestion()) {
      askCurrentQuestion();
    }
  }, FAST_MODE ? 800 : 1200);
}

// --- Voice Recognition Handler ---
function handleVoiceResult(transcript) {
  if (!voiceState.active || !transcript) return;
  
  // Clean and normalize the transcript for better processing
  const clean = transcript.toLowerCase().trim();
  console.log('Voice transcript:', transcript); // Debug logging
  
  // Immediate visual feedback
  updateVoiceStatus(`Processing: "${transcript}"`, 'processing');
  
  // Check for commands first (with debouncing to prevent double-processing)
  const now = performance.now();
  if (voiceState.lastProcessTime && (now - voiceState.lastProcessTime) < 500) {
    console.log('Debouncing voice input');
    return;
  }
  voiceState.lastProcessTime = now;
  
  const command = parseVoiceCommand(transcript);
  if (command) {
    updateVoiceStatus('Command recognized', 'success');
    handleVoiceCommand(command);
    return;
  }
  
  // Process as answer with improved reliability
  const question = getCurrentQuestion();
  if (!question) {
    updateVoiceStatus('No question found', 'error');
    return;
  }
  
  const answer = parseAnswer(transcript, question.question_type);
  console.log('Parsed answer:', answer, 'for question type:', question.question_type);
  
  if (answer !== null) {
    // Immediate feedback - don't wait for confirmation for simple answers
    updateVoiceStatus(`Answer recorded: ${answer}`, 'success');
    
    // Direct recording with better error handling
    try {
      recordAnswer(answer, question.question_type);
      
      // Provide immediate audio feedback
      const currentDisplayLang = state.currentLang || 'en';
      const messages = currentDisplayLang === 'ar' ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
      speak(messages.SCORE_CONFIRMED, { withBeep: false, rate: 1.4 });
      
      // Auto-advance after a short delay for better flow
      setTimeout(() => {
        if (voiceState.active && moveToNextQuestion()) {
          askCurrentQuestion();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error recording answer:', error);
      updateVoiceStatus('Error recording answer', 'error');
    }
    
  } else {
    // Improved "didn't understand" handling with specific guidance
    updateVoiceStatus(`Didn't understand: "${transcript}"`, 'error');
    
    const currentDisplayLang = state.currentLang || 'en';
    const messages = currentDisplayLang === 'ar' ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
    
    // Provide specific guidance based on question type
    let guidance = messages.NOT_UNDERSTOOD;
    if (question.question_type === 'rating') {
      guidance += currentDisplayLang === 'ar' ? 
        ' قل رقم من 1 إلى 5.' : 
        ' Say a number from 1 to 5.';
    } else if (question.question_type === 'yes_no') {
      guidance += currentDisplayLang === 'ar' ? 
        ' قل نعم أو لا.' : 
        ' Say yes or no.';
    }
    
    speak(guidance, { withBeep: false, rate: 1.2 });
    
    // Re-ask the question after guidance
    setTimeout(() => {
      if (voiceState.active) {
        askCurrentQuestion(true);
      }
    }, 3000);
  }
}

function handleVoiceCommand(command) {
  // Auto-detect response language for feedback
  const currentDisplayLang = state.currentLang || 'en';
  const messages = currentDisplayLang === 'ar' ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
  
  switch (command) {
    case 'NEXT_QUESTION':
      if (moveToNextQuestion()) {
        askCurrentQuestion(true);
      }
      break;
      
    case 'PREVIOUS_QUESTION':
      if (moveToPreviousQuestion()) {
        askCurrentQuestion(true);
      }
      break;
      
    case 'REPEAT_QUESTION':
      askCurrentQuestion(true);
      break;
      
    case 'SKIP_QUESTION':
      if (moveToNextQuestion()) {
        askCurrentQuestion();
      }
      break;
      
    case 'NEXT_CATEGORY':
      if (moveToNextCategory()) {
        askCurrentQuestion();
      }
      break;
      
    case 'PREVIOUS_CATEGORY':
      if (moveToPreviousCategory()) {
        askCurrentQuestion();
      }
      break;
      
    case 'HELP':
      // Provide help in both languages for universal understanding
      const helpMessage = currentDisplayLang === 'ar' ? 
        'قل أرقام من 1 إلى 5 للتقييمات، نعم أو لا للأسئلة، أو أوامر مثل التالي، السابق، أعد، مساعدة. You can also use English commands.' :
        'Say numbers 1 to 5 for ratings, yes or no for questions, or commands like next, previous, repeat, help. يمكنك أيضا استخدام الأوامر العربية.';
      
      speak(helpMessage, { force: true, withBeep: false });
      setTimeout(() => askCurrentQuestion(), 5000);
      break;
      
    case 'STATUS':
      const totalQuestions = QUESTIONS.length;
      const completed = document.querySelectorAll('input[type="radio"]:checked').length;
      const statusMessage = currentDisplayLang === 'ar' ? 
        `${completed} ${messages.PROGRESS_UPDATE} ${totalQuestions}` :
        `${completed} ${messages.PROGRESS_UPDATE} ${totalQuestions}`;
        
      speak(statusMessage, { withBeep: false });
      setTimeout(() => askCurrentQuestion(), 2000);
      break;
      
    case 'END_SURVEY':
      stopVoiceMode();
      break;
  }
}

// --- Session Management ---
function startVoiceMode() {
  if (voiceState.active) return;
  
  voiceState.active = true;
  voiceState.sessionStartTime = performance.now();
  voiceState.latencySamples = [];
  voiceState.lastProcessTime = 0; // Reset debouncing
  
  updateVoiceStatus('Starting voice mode...', 'active');
  
  // Expose for submission
  window.__latencySamplesSent = voiceState.latencySamples;
  
  const lang = state.currentLang === 'ar';
  const messages = lang ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
  
  speak(messages.STARTING, { force: true });
  
  setTimeout(() => {
    if (voiceState.active) { // Check if still active
      askCurrentQuestion();
      startSpeechRecognition();
    }
  }, FAST_MODE ? 1500 : 2500);
  
  updateVoiceUI(true);
}

function startCategoryVoice(categoryIndex) {
  voiceState.currentCategoryIndex = categoryIndex;
  voiceState.questionsInCategory = voiceState.categories[categoryIndex].questions;
  voiceState.currentQuestionIndex = 0;
  
  startVoiceMode();
}

function stopVoiceMode() {
  voiceState.active = false;
  updateVoiceStatus('Stopping voice mode...', 'active');
  stopSpeechRecognition();
  
  const lang = state.currentLang === 'ar';
  speak(lang ? 'تم إيقاف الوضع الصوتي' : 'Voice mode stopped', { force: true });
  
  // Clear status after a delay
  setTimeout(() => {
    updateVoiceStatus('Voice idle', 'info');
  }, 2000);
  
  updateVoiceUI(false);
}

function completeSurvey() {
  voiceState.active = false;
  stopSpeechRecognition();
  
  const lang = state.currentLang === 'ar';
  const messages = lang ? VOICE_MESSAGES.ar : VOICE_MESSAGES.en;
  
  speak(messages.SURVEY_COMPLETE, { force: true });
  updateVoiceUI(false);
}

function toggleVoiceMode() {
  if (voiceState.active) {
    stopVoiceMode();
  } else {
    startVoiceMode();
  }
}

// --- Speech Recognition Management ---
function startSpeechRecognition() {
  const recognizer = ensureSpeechRecognition();
  if (recognizer) {
    try {
      recognizer.start();
    } catch (e) {
      console.warn('Speech recognition start error:', e);
    }
  }
}

function stopSpeechRecognition() {
  if (recog) {
    try {
      recog.stop();
    } catch (e) {
      console.warn('Speech recognition stop error:', e);
    }
  }
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

function ensureSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported');
    updateVoiceStatus('Speech recognition not supported', 'error');
    return null;
  }
  
  if (recog) return recog;
  
  recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  
  // Set to auto-detect language or use multilingual mode
  // Many browsers support auto-detection or can handle multiple languages
  recog.lang = 'auto'; // Try auto-detection first
  
  // Fallback to English if auto not supported, but our parsing will handle both
  if (!recog.lang || recog.lang === 'auto') {
    recog.lang = 'en-US';
  }
  
  recog.onstart = () => {
    voiceState.listening = true;
    updateVoiceStatus('Listening...', 'listening');
    pushTranscript('[system] Multilingual recognition started (EN/AR)');
  };
  
  recog.onend = () => {
    voiceState.listening = false;
    updateVoiceStatus(voiceState.active ? 'Restarting...' : 'Voice stopped', 'active');
    pushTranscript('[system] Recognition ended');
    if (voiceState.active) {
      scheduleRestart(false);
    }
  };
  
  recog.onerror = (event) => {
    voiceState.listening = false;
    const errorMsg = `Recognition error: ${event.error}`;
    updateVoiceStatus(errorMsg, 'error');
    pushTranscript(`[error] ${event.error}`);
    if (voiceState.active) {
      scheduleRestart(true);
    }
  };
  
  recog.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      
      if (result.isFinal) {
        if (!isDuplicate(transcript.toLowerCase())) {
          pushTranscript(`[final] ${transcript}`);
          handleVoiceResult(transcript);
          registerFinal(transcript.toLowerCase());
        }
      } else {
        // Show partial results
        const partialElement = document.getElementById('onlinePartial');
        if (partialElement) {
          partialElement.textContent = transcript;
        }
      }
    }
  };
  
  return recog;
}

function scheduleRestart(isError = false) {
  if (!voiceState.active) return;
  
  if (restartTimer) clearTimeout(restartTimer);
  
  backoff = isError ? Math.min(backoff * 1.6, MAX_BACKOFF) : 400;
  
  restartTimer = setTimeout(() => {
    if (voiceState.active && recog) {
      try {
        recog.start();
      } catch (e) {
        console.warn('Restart error:', e);
      }
    }
  }, backoff);
}

// --- Utility Functions ---
function isDuplicate(transcript) {
  const now = Date.now();
  
  // Clean old entries
  while (recentFinals.length > 0 && now - recentFinals[0].timestamp > DUP_WINDOW_MS) {
    recentFinals.shift();
  }
  
  // Check for duplicate
  const isDup = recentFinals.some(entry => entry.text === transcript);
  
  return isDup;
}

function registerFinal(transcript) {
  recentFinals.push({
    text: transcript,
    timestamp: Date.now()
  });
}

function updateVoiceProgress() {
  const progressElement = document.getElementById('voiceProgress');
  if (progressElement && voiceState.categories.length > 0) {
    const currentCategory = voiceState.categories[voiceState.currentCategoryIndex];
    const totalInCategory = currentCategory.questions.length;
    const categoryProgress = `${currentCategory.name}: ${voiceState.currentQuestionIndex + 1}/${totalInCategory}`;
    progressElement.textContent = categoryProgress;
  }
}

function updateVoiceUI(active) {
  const voiceBtn = document.getElementById('voiceBtn');
  const floatingBtn = document.getElementById('floatingVoiceBtn');
  
  if (voiceBtn) {
    voiceBtn.textContent = active ? 'Stop Voice' : 'Voice Mode';
    voiceBtn.dataset.mode = active ? 'on' : 'off';
  }
  
  if (floatingBtn) {
    floatingBtn.classList.toggle('active', active);
    floatingBtn.innerHTML = active ? '🔴' : '🎤';
  }
}
