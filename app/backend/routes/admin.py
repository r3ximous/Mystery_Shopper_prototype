from fastapi import APIRouter, Depends
from ..services.survey_service import list_submissions, basic_metrics
from ..core.security import get_admin_auth

router = APIRouter()

@router.get("/submissions")
async def get_submissions(_: bool = Depends(get_admin_auth)):
    return list_submissions()

@router.get("/metrics")
async def get_metrics(_: bool = Depends(get_admin_auth)):
    return basic_metrics()
