# Local Development & Demo Guide

This guide shows a new contributor how to get the Mystery Shopper prototype running locally (localhost) so others can view it on their machine. It covers Windows (PowerShell) plus generic macOS/Linux notes.

---
## 1. Prerequisites
| Need | Version / Notes |
|------|-----------------|
| Python | 3.11+ (tested on 3.12) |
| Git | For cloning (or download zip) |
| Browser | Any modern (Chrome, Edge, Firefox, Safari) |

(Optional) Install Python from https://www.python.org/downloads/ and during install check: Add python.exe to PATH.

---
## 2. Clone (or Download) the Repository
```powershell
# From a folder you use for projects
git clone https://github.com/r3ximous/Mystery_Shopper_prototype.git
cd Mystery_Shopper_prototype
```
If you received a zip: extract it, then `cd` into the folder.

---
## 3. Create & Activate Virtual Environment
Windows (PowerShell):
```powershell
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
```
macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
Your prompt should now begin with `(.venv)`.

---
## 4. Install Dependencies
```powershell
pip install -r requirements.txt
```
(If pip warns about upgrade you can ignore or run `python -m pip install --upgrade pip` first.)

---
## 5. Run the Combined Frontend + API Server
The frontend FastAPI app mounts the backend API under `/api`.

```powershell
uvicorn app.frontend.app_frontend_server:frontend --reload
```
Expected console output includes: `Uvicorn running on http://127.0.0.1:8000`.

Open in browser:
- Main survey form: http://127.0.0.1:8000
- Admin dashboard (HTML): http://127.0.0.1:8000/admin
- API root (JSON): http://127.0.0.1:8000/api/
- Interactive API docs (Swagger UI): http://127.0.0.1:8000/api/docs

---
## 6. Submitting a Sample Survey (API)
Use the interactive docs or `curl`.

Example JSON payload:
```json
{
  "channel": "WEB",
  "location_code": "DXB01",
  "shopper_id": "SHOP123",
  "visit_datetime": "2025-08-18T10:30:00Z",
  "scores": [
    {"question_id": "Q1", "score": 5, "comment": "Great greeting"},
    {"question_id": "Q2", "score": 4},
    {"question_id": "Q3", "score": 5},
    {"question_id": "Q4", "score": 4},
    {"question_id": "Q5", "score": 5, "comment": "Excellent overall"}
  ],
  "latency_samples": [
    {"question_id": "Q1", "ms": 1200},
    {"question_id": "Q3", "ms": 980}
  ]
}
```

PowerShell `curl` (alias for `Invoke-WebRequest` so we use `Invoke-RestMethod`):
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/survey/submit -Method POST -Body (@'
{
  "channel": "WEB",
  "location_code": "DXB01",
  "shopper_id": "SHOP123",
  "visit_datetime": "2025-08-18T10:30:00Z",
  "scores": [
    {"question_id": "Q1", "score": 5, "comment": "Great greeting"},
    {"question_id": "Q2", "score": 4},
    {"question_id": "Q3", "score": 5},
    {"question_id": "Q4", "score": 4},
    {"question_id": "Q5", "score": 5, "comment": "Excellent overall"}
  ],
  "latency_samples": [
    {"question_id": "Q1", "ms": 1200},
    {"question_id": "Q3", "ms": 980}
  ]
}
'@) -ContentType 'application/json'
```

---
## 7. Admin Endpoints (Protected by API Key)
Endpoints:
- List submissions: `GET /api/admin/submissions`
- Basic metrics: `GET /api/admin/metrics`

Header required: `X-API-Key: dev-admin-key` (prototype hard-coded value).

Example (PowerShell):
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/admin/metrics -Headers @{"X-API-Key"="dev-admin-key"}
```

Example (bash curl):
```bash
curl -H "X-API-Key: dev-admin-key" http://127.0.0.1:8000/api/admin/metrics
```

---
## 8. Running Tests
```powershell
pytest -q
```
Add `-vv` for verbose, or `-k keyword` to filter.

---
## 9. Project Structure (Essentials)
```
app/
  backend/
    main.py            # FastAPI backend (routers mounted in frontend via /api)
    routes/            # survey + admin endpoints
    schemas/           # Pydantic models & validation
    services/          # In-memory data & metrics logic
    core/security.py   # Sanitization & API key guard
  frontend/
    app_frontend_server.py  # Frontend FastAPI app with templates
    templates/         # Jinja2 HTML templates (survey, admin)
    static/            # CSS, assets
```

---
## 10. Data Persistence Note
Currently submissions are stored in-memory (Python list). Restarting the server clears data. For persistence you would integrate SQLAlchemy models + a database (SQLite for dev). Alembic is already in requirements for future migrations.

---
## 11. Stopping the Server
Press `Ctrl + C` in the terminal running uvicorn. Deactivate the venv with:
```powershell
deactivate
```

---
## 12. Sharing Locally (Optional)
To allow others on your LAN to view your instance:
```powershell
uvicorn app.frontend.app_frontend_server:frontend --reload --host 0.0.0.0 --port 8000
```
Then they can visit: `http://YOUR_LOCAL_IP:8000` (find with `ipconfig` on Windows).

(For public internet sharing temporarily, use a tunneling tool like `ngrok http 8000`—not recommended for production secrets.)

---
## 13. Troubleshooting
| Symptom | Fix |
|---------|-----|
| ModuleNotFoundError | Ensure venv activated & dependencies installed |
| Address already in use | Change port: `--port 8001` |
| 401 on admin endpoints | Missing/wrong `X-API-Key` header |
| Validation errors posting survey | Check `question_id` values start with 'Q' (Q1..Q5) and channel is one of CALL_CENTER, ON_SITE, WEB, MOBILE_APP |
| UnicodeDecodeError on Windows | Ensure repository path has no special restricted chars; re-clone |

---
## 14. Next Steps (Optional Enhancements)
- Add persistent storage (SQLite file + SQLAlchemy models)
- Replace API key with OAuth2 / JWT
- Add frontend JS validation + localization
- Containerize with Docker for consistent runtime

---
Happy testing! 🚀
