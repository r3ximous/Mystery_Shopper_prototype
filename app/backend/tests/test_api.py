import pytest
from httpx import AsyncClient
from app.backend.main import app

@pytest.mark.asyncio
async def test_submit_and_metrics():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "channel": "CALL_CENTER",
            "location_code": "LOC1",
            "shopper_id": "S123",
            "visit_datetime": "2025-08-17T10:00:00Z",
            "scores": [
                {"question_id": "Q1", "score": 5},
                {"question_id": "Q2", "score": 4},
                {"question_id": "Q3", "score": 5},
                {"question_id": "Q4", "score": 3},
                {"question_id": "Q5", "score": 4}
            ]
        }
        r = await ac.post("/survey/submit", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data['id'] == 1
        # Admin endpoints require API key
        m = await ac.get("/admin/metrics", headers={"X-API-Key":"dev-admin-key"})
        assert m.status_code == 200
        metrics = m.json()
        assert metrics['total'] == 1
        assert metrics['avg_score'] is not None
        # Attempt without key should 401
        m2 = await ac.get("/admin/metrics")
        assert m2.status_code == 401
