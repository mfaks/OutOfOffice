from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.internal.agents.pipeline import run_pipeline
from app.internal.models import TripPlannerRequest, TripPlannerResponse

router = APIRouter()


@router.post("/trip", response_model=TripPlannerResponse, tags=["trip"])
async def create_trip(request: TripPlannerRequest):
    try:
        recommendations = await run_pipeline(request)
        return TripPlannerResponse(
            request=request,
            recommendations=recommendations,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
