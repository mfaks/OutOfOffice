import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app.core.limiter import limiter
from app.schemas.trip import TripPlannerRequest, TripPlannerResponse, TripState

router = APIRouter()


@router.post(
    "/trip",
    response_model=TripPlannerResponse,
    tags=["trip"],
)
@limiter.limit("5/hour")
async def create_trip(request: Request, body: TripPlannerRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state: TripState = {
        "request": body,
        "candidate_windows": [],
        "enriched_windows": [],
        "recommendations": [],
        "user_feedback": None,
        "refinement_count": 0,
    }

    try:
        result = await request.app.state.graph.ainvoke(initial_state, config=config)
        return TripPlannerResponse(
            thread_id=thread_id,
            request=body,
            recommendations=result["recommendations"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post(
    "/trips/{thread_id}/feedback",
    response_model=TripPlannerResponse,
    tags=["trip"],
)
@limiter.limit("5/hour")
async def provide_feedback(request: Request, thread_id: str, feedback: str):
    config = {"configurable": {"thread_id": thread_id}}

    try:
        snapshot = await request.app.state.graph.aget_state(config)
        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Trip session not found. Please start a new trip.",
            )
        result = await request.app.state.graph.ainvoke(
            {**dict(snapshot.values), "user_feedback": feedback},
            config=config,
        )
        return TripPlannerResponse(
            thread_id=thread_id,
            request=result["request"],
            recommendations=result["recommendations"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
