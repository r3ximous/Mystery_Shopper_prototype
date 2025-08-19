"""Single source of truth for survey questions (id, English & Arabic text)."""

QUESTIONS = [
    {"id": "Q1", "text_en": "Greeting professionalism", "text_ar": "التحية والاحترافية"},
    {"id": "Q2", "text_en": "Wait time satisfaction", "text_ar": "الرضا عن وقت الانتظار"},
    {"id": "Q3", "text_en": "Resolution effectiveness", "text_ar": "فعالية الحل"},
    {"id": "Q4", "text_en": "Facility cleanliness", "text_ar": "نظافة المرفق"},
    {"id": "Q5", "text_en": "Overall experience", "text_ar": "التجربة بشكل عام"},
]

def get_questions():
    return QUESTIONS
