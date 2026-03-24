from pydantic import BaseModel


class UserPreferencesRead(BaseModel):
    pto_days_remaining: int | None
    max_flight_budget: float | None
    default_departure: str | None
    default_destination: str | None
    company_holidays: list[str]
    preferred_months: list[int]


class UserPreferencesWrite(BaseModel):
    pto_days_remaining: int | None = None
    max_flight_budget: float | None = None
    default_departure: str | None = None
    default_destination: str | None = None
    company_holidays: list[str] = []
    preferred_months: list[int] = []
