from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional, List


class LatencySample(BaseModel):
    """Client-captured latency for answering a question (ms from prompt spoken to user response recognized)."""
    question_id: str
    ms: float = Field(gt=0, description="Latency in milliseconds")

    @field_validator("question_id")
    @classmethod
    def question_id_format(cls, v: str):  # reuse rule
        if not v or not v.startswith('Q'):
            raise ValueError("Question id must start with 'Q'")
        return v

class QuestionScore(BaseModel):
    question_id: str
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = None

    @field_validator("question_id")
    @classmethod
    def question_id_format(cls, v: str):
        if not v or not v.startswith('Q'):
            raise ValueError("Question id must start with 'Q'")
        return v

class SurveySubmissionIn(BaseModel):
    channel: str
    location_code: str
    shopper_id: str
    visit_datetime: datetime
    scores: List[QuestionScore]
    latency_samples: Optional[List[LatencySample]] = Field(default_factory=list, description="Per-question voice capture latency metrics")

    @model_validator(mode="after")
    def sanitize(self):
        # Late import to avoid circular dependencies
        from ..core.security import sanitize_text, validate_identifier, validate_channel
        self.channel = validate_channel(self.channel)
        self.location_code = validate_identifier(sanitize_text(self.location_code), 'location_code')
        self.shopper_id = validate_identifier(sanitize_text(self.shopper_id), 'shopper_id')
        # Comments sanitized
        for s in self.scores:
            if s.comment:
                from ..core.security import sanitize_text as _st
                s.comment = _st(s.comment)
        # Validate latency sample question ids exist in provided scores (best effort)
        if self.latency_samples:
            score_ids = {s.question_id for s in self.scores}
            for ls in self.latency_samples:
                if ls.question_id not in score_ids:
                    raise ValueError(f"Latency sample question_id not in scores: {ls.question_id}")
        return self

class SurveySubmissionOut(SurveySubmissionIn):
    id: int
    created_at: datetime
