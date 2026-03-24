from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class UserPreferences(SQLModel, table=True):
    __tablename__ = "userpreferences"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    pto_days_remaining: int | None = None
    max_flight_budget: float | None = None
    default_departure: str | None = None
    default_destination: str | None = None
    company_holidays_json: str = Field(default="[]")
    preferred_months_json: str = Field(default="[]")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
