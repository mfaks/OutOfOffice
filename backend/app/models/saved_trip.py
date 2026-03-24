from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class SavedTrip(SQLModel, table=True):
    __tablename__ = "savedtrip"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    departure: str
    destination: str
    start_date: str
    end_date: str
    pto_days_used: int
    total_days_off: int
    recommendation_json: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
