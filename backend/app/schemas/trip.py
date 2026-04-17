from enum import Enum
from typing import Literal, TypedDict

from pydantic import BaseModel, Field


class FeedbackBody(BaseModel):
    feedback: str


class TripPriority(str, Enum):
    best_yield = "best_yield"  # most days off per PTO day (default)
    lowest_cost = "lowest_cost"  # cheapest flights
    most_pto = "most_pto"  # maximize trip length
    least_pto = "least_pto"  # minimize PTO used


class TripPlannerRequest(BaseModel):
    departure: str
    destination: str
    pto_days_remaining: int = Field(gt=0)
    min_pto_days: int | None = Field(default=None, gt=0)
    max_flight_budget: float | None = None
    company_holidays: list[str] | None = None
    preferred_months: list[int] | None = None
    priority: TripPriority = TripPriority.best_yield


class FlightOption(BaseModel):
    airline: str
    estimated_flight_cost: float
    layovers: int
    outbound_departs_at: str
    outbound_arrives_at: str
    return_departs_at: str
    return_arrives_at: str


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
    itinerary: list[DayItinerary] = Field(default_factory=list)


class CandidateWindow(TypedDict):
    start_date: str
    end_date: str
    total_days_off: int
    pto_days_used: int
    yield_score: float


class EnrichedWindow(CandidateWindow):
    best_flight: dict


class TripPlannerResponse(BaseModel):
    thread_id: str
    request: TripPlannerRequest
    recommendations: list[TripRecommendation]
    generated_at: str


class TripState(TypedDict):
    request: TripPlannerRequest
    candidate_windows: list[CandidateWindow]
    enriched_windows: list[EnrichedWindow]
    recommendations: list[TripRecommendation]
    user_feedback: str | None
    refinement_count: int
