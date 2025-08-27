// Configuration & constants for survey voice modules
// Use questions injected by backend for comprehensive survey support
export const QUESTIONS = (window.__SURVEY_QUESTIONS || []);

// Voice recognition confidence threshold
export const CONFIDENCE_THRESHOLD = 0.4;

// Debug settings
export const MAX_DEBUG_LINES = 100;

// Voice command patterns for comprehensive survey
export const VOICE_COMMANDS = {
  // Navigation commands
  NEXT_QUESTION: ['next', 'التالي', 'next question', 'السؤال التالي'],
  PREVIOUS_QUESTION: ['previous', 'السابق', 'go back', 'ارجع'],
  REPEAT_QUESTION: ['repeat', 'أعد', 'repeat question', 'أعد السؤال'],
  SKIP_QUESTION: ['skip', 'تخطي', 'skip question', 'تخطي السؤال'],
  
  // Category navigation
  NEXT_CATEGORY: ['next category', 'next section', 'الفئة التالية', 'القسم التالي'],
  PREVIOUS_CATEGORY: ['previous category', 'previous section', 'الفئة السابقة', 'القسم السابق'],
  
  // Survey control
  START_SURVEY: ['start survey', 'begin survey', 'ابدأ التقييم', 'ابدأ الاستطلاع'],
  END_SURVEY: ['end survey', 'stop survey', 'انهي التقييم', 'توقف'],
  SAVE_PROGRESS: ['save', 'احفظ', 'save progress', 'احفظ التقدم'],
  
  // Question type responses
  YES_RESPONSES: ['yes', 'yeah', 'yep', 'correct', 'right', 'نعم', 'ايه', 'أجل', 'صحيح'],
  NO_RESPONSES: ['no', 'nope', 'nah', 'incorrect', 'wrong', 'لا', 'خطأ', 'غير صحيح'],
  
  // Help and information
  HELP: ['help', 'مساعدة', 'what can I say', 'ماذا يمكنني قول'],
  STATUS: ['status', 'progress', 'الحالة', 'التقدم', 'where am I', 'اين انا']
};

// Enhanced score mapping for multilingual support
export const SCORE_MAP = {
  // English numbers
  'zero': 0, '0': 0,
  'one': 1, '1': 1, 'first': 1, 'won': 1,
  'two': 2, '2': 2, 'second': 2, 'to': 2, 'too': 2,
  'three': 3, '3': 3, 'third': 3,
  'four': 4, '4': 4, 'fourth': 4, 'for': 4,
  'five': 5, '5': 5, 'fifth': 5,
  
  // Arabic numbers and words
  'صفر': 0, '٠': 0,
  'واحد': 1, 'وان': 1, 'الأول': 1, '١': 1,
  'اثنان': 2, 'اثنين': 2, 'تو': 2, 'الثاني': 2, '٢': 2,
  'ثلاثة': 3, 'الثالث': 3, '٣': 3,
  'أربعة': 4, 'اربعة': 4, 'الرابع': 4, '٤': 4,
  'خمسة': 5, 'الخامس': 5, '٥': 5
};

// Question type configurations
export const QUESTION_TYPES = {
  RATING: 'rating',
  YES_NO: 'yes_no', 
  MULTIPLE_CHOICE: 'multiple_choice'
};

// Voice feedback messages
export const VOICE_MESSAGES = {
  en: {
    STARTING: 'Starting voice mode. Say "help" for commands.',
    QUESTION_PREFIX: 'Question',
    RATING_SUFFIX: 'Rate from 1 to 5 stars',
    YES_NO_SUFFIX: 'Say yes or no',
    CHOICE_SUFFIX: 'Choose an option',
    SCORE_CONFIRMED: 'Recorded',
    NEXT_QUESTION: 'Next question',
    SURVEY_COMPLETE: 'Survey completed',
    HELP_MESSAGE: 'Say numbers 1 to 5 for ratings, yes or no for questions, or commands like next, previous, repeat, help.',
    NOT_UNDERSTOOD: 'Did not understand. Please repeat.',
    INVALID_SCORE: 'Please say a number from 1 to 5',
    CATEGORY_CHANGED: 'Moving to next category',
    PROGRESS_UPDATE: 'questions completed out of'
  },
  ar: {
    STARTING: 'بدء الوضع الصوتي. قل "مساعدة" للأوامر.',
    QUESTION_PREFIX: 'السؤال',
    RATING_SUFFIX: 'قيم من 1 إلى 5 نجوم',
    YES_NO_SUFFIX: 'قل نعم أو لا',
    CHOICE_SUFFIX: 'اختر خيار',
    SCORE_CONFIRMED: 'تم التسجيل',
    NEXT_QUESTION: 'السؤال التالي',
    SURVEY_COMPLETE: 'انتهى الاستطلاع',
    HELP_MESSAGE: 'قل أرقام من 1 إلى 5 للتقييمات، نعم أو لا للأسئلة، أو أوامر مثل التالي، السابق، أعد، مساعدة.',
    NOT_UNDERSTOOD: 'لم أفهم. يرجى الإعادة.',
    INVALID_SCORE: 'يرجى قول رقم من 1 إلى 5',
    CATEGORY_CHANGED: 'الانتقال للفئة التالية',
    PROGRESS_UPDATE: 'سؤال مكتمل من أصل'
  }
};
