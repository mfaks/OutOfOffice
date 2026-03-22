import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.internal.agents.pipeline import graph
from app.internal.models import TripPlannerRequest, TripPlannerResponse, TripState

router = APIRouter()


@router.post("/trip", response_model=TripPlannerResponse, tags=["trip"])
async def create_trip(request: TripPlannerRequest):

    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state: TripState = {
        "request": request,
        "candidate_windows": [],
        "enriched_windows": [],
        "recommendations": [],
        "user_feedback": None,
        "refinement_count": 0,
    }

    try:
        recommendations = await graph.ainvoke(initial_state, config=config)
        return TripPlannerResponse(
            thread_id=thread_id,
            request=request,
            recommendations=recommendations["recommendations"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/trips/{thread_id}/feedback", response_model=TripPlannerResponse, tags=["trip"]
)
async def provide_feedback(thread_id: str, feedback: str):
    config = {"configurable": {"thread_id": thread_id}}

    try:
        snapshot = await graph.aget_state(config)
        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Trip session not found. Please start a new trip.",
            )
        result = await graph.ainvoke(
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
