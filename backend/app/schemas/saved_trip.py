from pydantic import BaseModel

from app.schemas.trip import TripRecommendation


class SavedTripCreate(BaseModel):
    departure: str
    destination: str
    recommendation: TripRecommendation


class SavedTripRead(BaseModel):
    id: int
    departure: str
    destination: str
    start_date: str
    end_date: str
    pto_days_used: int
    total_days_off: int
    recommendation: TripRecommendation
    saved_at: str


class SavedTripListRead(BaseModel):
    trips: list[SavedTripRead]
    pto_days_remaining: int | None
