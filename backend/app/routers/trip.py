from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.internal.models import TripPlannerRequest, TripPlannerResponse

router = APIRouter()


@router.post("/trip", response_model=TripPlannerResponse, tags=["trip"])
async def create_trip(request: TripPlannerRequest):
    try:
        # TODO: Impelement Agent logic
        # Await agent response

        # Temp response until agent is implemented
        return TripPlannerResponse(
            request=request,
            recommendations=[],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
