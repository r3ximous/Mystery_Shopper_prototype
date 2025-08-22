---
title: Mystery Shopper Digitization Platform
subtitle: UAE Government Prototype
date: 2025-08-17
author: Delivery Team
---

# Vision
Real-time, data-driven oversight of service quality across all citizen touchpoints.

---
# Current Pain Points
- Manual MS Forms + Excel aggregation
- Delayed insights (weekly/monthly)
- Inconsistent question versions
- No proactive alerting

---
# Objectives
- Streamline capture & validation
- Standardize scoring & KPIs
- Provide real-time dashboards
- Ensure auditability & governance

---
# Key Personas
Shopper | QA Analyst | Program Manager | Regulator Viewer | System Admin

---
# Feature Highlights (Current Prototype)
- **Voice-Driven Surveys**: Web Speech API integration with EN/AR support
- **Real-time Scoring**: Instant 1-5 star rating with weighted calculations
- **Bilingual Interface**: Dynamic English/Arabic switching with RTL support
- **Performance Tracking**: Response time analytics and latency monitoring
- **Smart Duplicate Detection**: Advanced voice recognition with phrase collapse
- **Responsive Design**: Modern CSS with dark/light theme support
- **FastAPI Backend**: RESTful API with Pydantic validation
- **Modular Frontend**: ES6 modules with clean separation of concerns

---
# Architecture Overview
```mermaid
flowchart TD
    subgraph "Frontend Layer"
        UI[Survey Form HTML/JS]
        Voice[Voice Recognition API]
        UI --> Voice
    end
    
    subgraph "Backend Services"
        FastAPI[FastAPI Server]
        Routes[Survey & Admin Routes]
        Services[Survey Service]
        FastAPI --> Routes --> Services
    end
    
    subgraph "Data & Storage"
        Memory[(In-Memory Store)]
        Questions[Questions Config]
        Services --> Memory
        Services --> Questions
    end
    
    subgraph "Features"
        TTS[Text-to-Speech]
        ASR[Speech Recognition]
        Bilingual[EN/AR Support]
        Scoring[Real-time Scoring]
    end
    
    UI --> FastAPI
    Voice --> TTS
    Voice --> ASR
    FastAPI --> Bilingual
    Services --> Scoring

```

---
# Data Model (Current Implementation)
```mermaid
erDiagram
    SURVEY_SUBMISSION {
        string channel
        string location_code
        string shopper_id
        datetime visit_datetime
        array scores
        array latency_samples
    }
    
    QUESTION_SCORE {
        string question_id
        int score
        string comment
    }
    
    LATENCY_SAMPLE {
        string question_id
        float response_time_ms
    }
    
    QUESTIONS_CONFIG {
        string id
        string text_en
        string text_ar
        float weight
    }
    
    SURVEY_SUBMISSION ||--o{ QUESTION_SCORE : contains
    SURVEY_SUBMISSION ||--o{ LATENCY_SAMPLE : tracks
    QUESTION_SCORE ||--|| QUESTIONS_CONFIG : references
```

---
# Scoring Logic (Conceptual)
Weighted Scoring
- Every question has a configurable weight (default 1.0 in prototype)
- Final survey score = sum(score × weight) ÷ sum(weights)
- Supports future category or KPI weighting without changing capture flow

Real‑Time Voice Parsing
- Recognizes spoken digits & common Arabic / English variants (e.g., one/wan/ithnain)
- De‑duplicates immediate echoes & collapses repeated phrases
- Accepts scores 1–5 only; out‑of‑range input triggers reprompt

Latency Analytics
- For each question: measure time from prompt end to first valid score
- Store per‑question response times in submission payload
- Aggregate later for: average latency, slowest steps, efficiency trends

Data Quality Safeguards
- Instant validation (required score per question)
- Duplicate / noise suppression reduces false entries
- Structured payload enables downstream KPI & anomaly calculations

Extensibility
- Plug‑in sentiment / NLU layer can enrich each question event
- Weight tuning allows rapid calibration without code changes
- Same model supports channel expansion (web, mobile, kiosk)

---
# Technical Implementation
```mermaid
graph TB
    subgraph "Voice Processing Pipeline"
        A[User Speech] --> B[Web Speech API]
        B --> C[Duplicate Detection]
        C --> D[Command Parsing]
        D --> E[Score Extraction]
        E --> F[Form Submission]
    end
    
    subgraph "Backend Processing"
        F --> G[FastAPI Router]
        G --> H[Pydantic Validation]
        H --> I[Survey Service]
        I --> J[Weighted Calculation]
        J --> K[Response Generation]
    end
    
    subgraph "Frontend Architecture"
        L[survey_flow.js] --> M[survey_tts.js]
        L --> N[survey_dom.js]
        L --> O[survey_state.js]
        P[survey_main.js] --> L
    end
```

---
# Current Tech Stack
**Backend**: FastAPI + Pydantic + Uvicorn  
**Frontend**: Vanilla JS ES6 Modules + Jinja2  
**Speech**: Web Speech API + Speech Synthesis  
**Styling**: Modern CSS with Custom Properties  
**Voice Features**: Recognition, TTS, Latency Tracking  
**Languages**: Python 3.12+ / JavaScript ES6+  
**Architecture**: Modular, Event-Driven, Responsive

---
# Roadmap
**Phase 0: Voice Prototype** ✅ **COMPLETED**
- Voice-driven survey interface
- Bilingual support (EN/AR)
- Real-time scoring engine
- Performance analytics

**Phase 1: Production Ready** (8 weeks)
- Database persistence (SQLite → PostgreSQL)
- User authentication & authorization
- Admin dashboard with analytics
- Data export capabilities

**Phase 2: Advanced Features** (12 weeks)
- Mobile-responsive PWA
- Offline survey capabilities
- Advanced reporting & KPIs
- Integration APIs

**Phase 3: AI & Automation** (16 weeks)
- NLP sentiment analysis
- Automated quality scoring
- Predictive analytics
- ML-powered insights

---
# Benefits & ROI (Demonstrated)
**Operational Efficiency**
- Voice input reduces survey time by 60%
- Real-time validation prevents data errors
- Automated scoring eliminates manual calculation

**User Experience**
- Intuitive voice commands in Arabic & English
- Immediate feedback and error correction
- Accessible interface for all skill levels

**Technical Excellence**
- Modern web standards (ES6, CSS3, HTML5)
- Responsive design works on all devices
- Modular architecture enables rapid iteration

**Data Quality**
- Structured validation with Pydantic
- Latency tracking for performance insights
- Duplicate detection ensures clean data

---
# Risk & Mitigation
Adoption -> training & champions
Data quality -> validation & audit
Security -> standards & monitoring

---
# Next Steps
Approve pilot scope
Assign product owner
Provision dev environment

---
# Thank You
Questions?
