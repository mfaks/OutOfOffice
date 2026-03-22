from typing import Literal, TypedDict

from pydantic import BaseModel, Field


class TripPlannerRequest(BaseModel):
    departure: str
    destination: str
    pto_days_remaining: int = Field(gt=0)
    min_pto_days: int | None = None
    max_flight_budget: float | None = None
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
    thread_id: str
    request: TripPlannerRequest
    recommendations: list[TripRecommendation]
    generated_at: str


class TripState(TypedDict):
    request: TripPlannerRequest
    candidate_windows: list[dict]
    enriched_windows: list[dict]
    recommendations: list[TripRecommendation]
    user_feedback: str | None
    refinement_count: int
