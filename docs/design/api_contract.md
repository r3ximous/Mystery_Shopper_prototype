# API Contract (Proto v0.1)

## POST /survey/submit
Submit a new survey submission.

Request
```
{
  "channel": "CALL_CENTER",
  "location_code": "LOC1",
  "shopper_id": "S123",
  "visit_datetime": "2025-08-17T10:00:00Z",
  "scores": [ {"question_id":"Q1","score":5} ... ]
}
```

Response 200
```
{
  "id": 1,
  "channel": "CALL_CENTER",
  "location_code": "LOC1",
  "shopper_id": "S123",
  "visit_datetime": "2025-08-17T10:00:00Z",
  "scores": [...],
  "created_at": "2025-08-17T11:00:00Z"
}
```

## GET /admin/submissions
List submissions (pagination TBD).

## GET /admin/metrics
Provides aggregate simple metrics.
