from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.rate_limit import RateLimit
from app.models.user import User

ANON_REQUEST_LIMIT = 1
ANON_REFINEMENT_LIMIT = 1
AUTH_REQUEST_LIMIT = 3


def _get_or_create(db: Session, key: str, today) -> RateLimit:
    record = db.exec(
        select(RateLimit).where(RateLimit.key == key, RateLimit.date == today)
    ).first()
    if not record:
        record = RateLimit(key=key, date=today)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def check_trip_rate_limit(
    request: Request,
    user: Annotated[User | None, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    today = datetime.now(timezone.utc).date()

    if user:
        key = f"user:{user.id}"
        limit = AUTH_REQUEST_LIMIT
        over_limit_msg = "You have reached your 3 trip requests for today."
    else:
        key = f"ip:{request.client.host}"
        limit = ANON_REQUEST_LIMIT
        over_limit_msg = "Daily limit reached. Sign up for more requests."

    record = _get_or_create(db, key, today)
    if record.request_count >= limit:
        raise HTTPException(status_code=429, detail=over_limit_msg)

    record.request_count += 1
    db.add(record)
    db.commit()


def check_refinement_rate_limit(
    request: Request,
    user: Annotated[User | None, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    if user:
        return  # logged-in users get unlimited refinements

    today = datetime.now(timezone.utc).date()
    key = f"ip:{request.client.host}"

    record = _get_or_create(db, key, today)
    if record.refinement_count >= ANON_REFINEMENT_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Daily refinement limit reached. Sign up for unlimited refinements.",
        )

    record.refinement_count += 1
    db.add(record)
    db.commit()
