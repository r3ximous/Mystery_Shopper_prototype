// Configuration & constants for survey voice modules
// Prefer questions injected by backend to avoid duplication; fallback to default set.

// Ensure questions have proper structure
function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  
  return rawQuestions.map(q => ({
    id: q.id || q.code,
    text_en: q.text_en || q.text || 'Question text missing',
    text_ar: q.text_ar || q.text || 'نص السؤال مفقود',
    weight: q.weight || 1.0
  }));
}

export const QUESTIONS = normalizeQuestions(window.__SURVEY_QUESTIONS || [
  { id:'Q1', text_en:'Greeting professionalism', text_ar:'التحية والاحترافية' },
  { id:'Q2', text_en:'Wait time satisfaction', text_ar:'الرضا عن وقت الانتظار' },
  { id:'Q3', text_en:'Resolution effectiveness', text_ar:'فعالية الحل' },
  { id:'Q4', text_en:'Facility cleanliness', text_ar:'نظافة المرفق' },
  { id:'Q5', text_en:'Overall experience', text_ar:'التجربة بشكل عام' }
]);

export const MAX_DEBUG_LINES = 50;
export const CONFIDENCE_THRESHOLD = 0.4;
