from typing import Literal

from pydantic import BaseModel, Field

TripStyle = Literal["long", "short"]


class TripPlannerRequest(BaseModel):
    departure: str
    destination: str
    pto_days_remaining: int = Field(gt=0)
    max_flight_budget: float | None = None
    trip_style: TripStyle | None = None
    company_holidays: list[str] | None = None


class FlightOption(BaseModel):
    airline: str
    estimated_flight_cost: float
    layovers: int
    departs_at: str
    returns_at: str


class TripRecommendation(BaseModel):
    rank: Literal[1, 2, 3]
    start_date: str
    end_date: str
    total_days_off: int
    pto_days_used: int
    yield_score: float
    best_flight: FlightOption
    reasoning: str


class TripPlannerResponse(BaseModel):
    request: TripPlannerRequest
    recommendations: list[TripRecommendation]
    generated_at: str
