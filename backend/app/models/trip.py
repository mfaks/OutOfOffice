from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class TripSession(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    thread_id: str = Field(index=True, unique=True)
    departure: str
    destination: str
    pto_days_remaining: int
    recommendations_json: str
    user_id: int | None = Field(default=None, foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
