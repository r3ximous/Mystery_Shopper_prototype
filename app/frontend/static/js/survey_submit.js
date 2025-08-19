import { QUESTIONS } from './survey_config.js';
import { state } from './survey_state.js';

export function initSubmit(){
  const form = document.getElementById('surveyForm');
  const resultEl = document.getElementById('result');
  if(!form) return;
  form.visit_datetime.value = new Date().toISOString().slice(0,16);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      channel: data.get('channel'),
      location_code: data.get('location_code'),
      shopper_id: data.get('shopper_id'),
      visit_datetime: new Date(data.get('visit_datetime')).toISOString(),
      scores: QUESTIONS.map(q => ({
        question_id: q.id,
        score: parseInt(data.get(q.id)),
        comment: (data.get('comment_'+q.id) || '').trim() || undefined
      })),
  latency_samples: (window.__latencySamplesSent || state.latencySamples).slice(-25)
    };
    resultEl.textContent = 'Submitting...';
    try { const res = await fetch('/api/survey/submit', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); const json = await res.json(); if(!res.ok) throw new Error(json.detail||'Error'); resultEl.textContent = JSON.stringify(json,null,2); resultEl.scrollIntoView({behavior:'smooth'}); } catch(err){ resultEl.textContent = 'Submission failed: '+err.message; }
  });
  document.getElementById('resetBtn')?.addEventListener('click', () => { form.reset(); resultEl.textContent = 'Form reset.'; });
}
