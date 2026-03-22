import json
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.core.rate_limit import check_refinement_rate_limit, check_trip_rate_limit
from app.db.session import get_db
from app.internal.agents.pipeline import graph
from app.models.trip import TripSession
from app.models.user import User
from app.schemas.trip import TripPlannerRequest, TripPlannerResponse, TripState

router = APIRouter()


@router.post(
    "/trip",
    response_model=TripPlannerResponse,
    tags=["trip"],
    dependencies=[Depends(check_trip_rate_limit)],
)
async def create_trip(
    request: TripPlannerRequest,
    user: Annotated[User | None, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
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
        result = await graph.ainvoke(initial_state, config=config)
        recommendations = result["recommendations"]

        session = TripSession(
            thread_id=thread_id,
            departure=request.departure,
            destination=request.destination,
            pto_days_remaining=request.pto_days_remaining,
            recommendations_json=json.dumps([r.model_dump() for r in recommendations]),
            user_id=user.id if user else None,
        )
        db.add(session)
        db.commit()

        return TripPlannerResponse(
            thread_id=thread_id,
            request=request,
            recommendations=recommendations,
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
    dependencies=[Depends(check_refinement_rate_limit)],
)
async def provide_feedback(
    thread_id: str,
    feedback: str,
    user: Annotated[User | None, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    session = db.exec(
        select(TripSession).where(TripSession.thread_id == thread_id)
    ).first()
    if session and session.user_id is not None:
        if user is None or user.id != session.user_id:
            raise HTTPException(status_code=403, detail="Access denied.")

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
    except Exception:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
