from enum import Enum
from typing import Literal, TypedDict

from pydantic import BaseModel, Field


class TripPriority(str, Enum):
    best_yield = "best_yield"  # most days off per PTO day (default)
    lowest_cost = "lowest_cost"  # cheapest flights
    most_pto = "most_pto"  # maximize trip length
    least_pto = "least_pto"  # minimize PTO used


class TripPlannerRequest(BaseModel):
    departure: str
    destination: str
    pto_days_remaining: int = Field(gt=0)
    min_pto_days: int | None = None
    max_flight_budget: float | None = None
    company_holidays: list[str] | None = None
    preferred_months: list[int] | None = None
    priority: TripPriority = TripPriority.best_yield


class FlightOption(BaseModel):
    airline: str
    estimated_flight_cost: float
    layovers: int
    departs_at: str
    returns_at: str


class DayItinerary(BaseModel):
    date: str
    note: str
    activities: list[str]


class TripRecommendation(BaseModel):
    rank: Literal[1, 2, 3, 4, 5]
    start_date: str
    end_date: str
    total_days_off: int
    pto_days_used: int
    yield_score: float
    best_flight: FlightOption
    reasoning: str
    itinerary: list[DayItinerary] = []


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
