import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.saved_trip import SavedTrip
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.saved_trip import SavedTripCreate, SavedTripListRead, SavedTripRead
from app.schemas.trip import TripRecommendation

router = APIRouter(prefix="/me/trips", tags=["saved_trips"])


def _require_user(user: Annotated[User | None, Depends(get_current_user)]) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def _row_to_read(row: SavedTrip) -> SavedTripRead:
    return SavedTripRead(
        id=row.id,
        departure=row.departure,
        destination=row.destination,
        start_date=row.start_date,
        end_date=row.end_date,
        pto_days_used=row.pto_days_used,
        total_days_off=row.total_days_off,
        recommendation=TripRecommendation.model_validate(
            json.loads(row.recommendation_json)
        ),
        saved_at=row.saved_at.isoformat(),
    )


@router.post("", response_model=SavedTripRead, status_code=201)
def save_trip(
    body: SavedTripCreate,
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    prefs = db.exec(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    ).first()

    pto_days_used = body.recommendation.pto_days_used

    if prefs is not None and prefs.pto_days_remaining is not None:
        if pto_days_used > prefs.pto_days_remaining:
            raise HTTPException(
                status_code=422,
                detail="Not enough PTO days remaining",
            )
        prefs.pto_days_remaining -= pto_days_used

    trip = SavedTrip(
        user_id=user.id,
        departure=body.departure,
        destination=body.destination,
        start_date=body.recommendation.start_date,
        end_date=body.recommendation.end_date,
        pto_days_used=pto_days_used,
        total_days_off=body.recommendation.total_days_off,
        recommendation_json=json.dumps(body.recommendation.model_dump()),
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _row_to_read(trip)


@router.get("", response_model=SavedTripListRead)
def list_trips(
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    rows = db.exec(
        select(SavedTrip)
        .where(SavedTrip.user_id == user.id)
        .order_by(SavedTrip.saved_at.desc())
    ).all()

    prefs = db.exec(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    ).first()

    return SavedTripListRead(
        trips=[_row_to_read(r) for r in rows],
        pto_days_remaining=prefs.pto_days_remaining if prefs else None,
    )


@router.get("/{trip_id}", response_model=SavedTripRead)
def get_trip(
    trip_id: int,
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    trip = db.get(SavedTrip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _row_to_read(trip)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    trip_id: int,
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    trip = db.get(SavedTrip, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    prefs = db.exec(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    ).first()

    if prefs is not None and prefs.pto_days_remaining is not None:
        prefs.pto_days_remaining += trip.pto_days_used

    db.delete(trip)
    db.commit()
    return Response(status_code=204)
