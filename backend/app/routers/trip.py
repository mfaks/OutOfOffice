import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app.core.limiter import limiter
from app.schemas.trip import (
    FeedbackBody,
    TripPlannerRequest,
    TripPlannerResponse,
    TripState,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/trip",
    response_model=TripPlannerResponse,
    tags=["trip"],
    responses={
        500: {"description": "An unexpected error occurred."},
    },
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
        logger.exception("trip creation failed")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post(
    "/trips/{thread_id}/feedback",
    response_model=TripPlannerResponse,
    tags=["trip"],
    responses={
        404: {"description": "Trip session not found. Please start a new trip."},
        500: {"description": "An unexpected error occurred."},
    },
)
@limiter.limit("5/hour")
async def provide_feedback(request: Request, thread_id: str, body: FeedbackBody):
    config = {"configurable": {"thread_id": thread_id}}

    try:
        snapshot = await request.app.state.graph.aget_state(config)
        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Trip session not found. Please start a new trip.",
            )
        await request.app.state.graph.aupdate_state(
            config, {"user_feedback": body.feedback}
        )
        result = await request.app.state.graph.ainvoke(None, config=config)
        return TripPlannerResponse(
            thread_id=thread_id,
            request=result["request"],
            recommendations=result["recommendations"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("trip feedback failed")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
