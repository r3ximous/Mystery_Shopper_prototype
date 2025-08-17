# UAE Government Mystery Shopper Digitization

Initial scaffold for end-to-end automation platform replacing manual MS Forms + Excel.

## Components
- FastAPI backend (API, auth, scoring engine)
- Simple HTML/JS frontend (responsive, Arabic/English ready)
- Data layer (SQLite dev, Postgres prod)
- Documentation: architecture, design rationale, wireframes, pitch deck outline

## Quick Start
```
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.frontend.app_frontend_server:frontend --reload
```
Open http://127.0.0.1:8000 for submission form, /admin for dashboard.

## Run Tests
```
pytest -q
```

## Repository Map (Key Files)
- app/backend/main.py (API root)
- app/frontend/app_frontend_server.py (Frontend + mounted API)
- docs/design/architecture.md (Architecture + mermaid diagram)
- docs/design/design_sheet.md (Product & NFRs)
- docs/wireframes/wireframes.md (Text wireframes)
- docs/presentation/deck.md (Slide-compatible markdown deck)
- docs/presentation/pitch_deck_outline.md (Outline)

## Prototype Security & Sanitization
- Pydantic validators enforce formats & ranges
- Input text sanitized & stripped via bleach (no HTML allowed)
- Channel & identifier allow-list patterns
- Admin endpoints protected by X-API-Key header (placeholder dev-admin-key)

For production: replace API key with OAuth2/OIDC + role claims, move secrets to environment / vault, add rate limiting & full audit logging.

## Next Steps
- Flesh out role-based access
- Add analytics dashboards
- Integrate Power BI / BI tool export
- Implement multilingual interface (RTL)
