import json
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.user_preferences import UserPreferencesRead, UserPreferencesWrite

router = APIRouter(prefix="/me", tags=["user"])

_EMPTY_PREFS = UserPreferencesRead(
    pto_days_remaining=None,
    max_flight_budget=None,
    default_departure=None,
    default_destination=None,
    company_holidays=[],
    preferred_months=[],
)


def _require_user(user: Annotated[User | None, Depends(get_current_user)]) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def _row_to_read(row: UserPreferences) -> UserPreferencesRead:
    return UserPreferencesRead(
        pto_days_remaining=row.pto_days_remaining,
        max_flight_budget=row.max_flight_budget,
        default_departure=row.default_departure,
        default_destination=row.default_destination,
        company_holidays=json.loads(row.company_holidays_json),
        preferred_months=json.loads(row.preferred_months_json),
    )


@router.get("/preferences", response_model=UserPreferencesRead)
def get_preferences(
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    row = db.exec(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    ).first()
    if not row:
        return _EMPTY_PREFS
    return _row_to_read(row)


@router.put("/preferences", response_model=UserPreferencesRead)
def update_preferences(
    body: UserPreferencesWrite,
    user: Annotated[User, Depends(_require_user)],
    db: Annotated[Session, Depends(get_db)],
):
    row = db.exec(
        select(UserPreferences).where(UserPreferences.user_id == user.id)
    ).first()
    if not row:
        row = UserPreferences(user_id=user.id)
        db.add(row)

    row.pto_days_remaining = body.pto_days_remaining
    row.max_flight_budget = body.max_flight_budget
    row.default_departure = body.default_departure
    row.default_destination = body.default_destination
    row.company_holidays_json = json.dumps(body.company_holidays)
    row.preferred_months_json = json.dumps(body.preferred_months)
    row.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(row)
    return _row_to_read(row)
