import math
from datetime import date
from unittest.mock import AsyncMock, patch

from app.internal.agents.planner import _score_window, planner_node
from app.schemas.trip import TripPlannerRequest


def test_score_window_basic():
    start = date(2026, 6, 1)  # Monday
    result = _score_window(start, 2, set())
    assert result is not None
    assert result["pto_days_used"] == 2
    assert result["start_date"] == "2026-06-01"


def test_score_window_weekend_is_free():
    start = date(
        2026, 6, 5
    )  # starts on a Friday; the weekend adds free days so 2 PTO days yields 4 days off
    result = _score_window(start, 2, set())
    assert result is not None
    assert result["pto_days_used"] == 2
    assert result["total_days_off"] == 4


def test_score_window_holiday_is_free():
    start = date(2026, 6, 1)  # Monday is a holiday → Tuesday consumes the PTO day
    holidays = {"2026-06-01"}
    result = _score_window(start, 1, holidays)
    assert result is not None
    assert result["total_days_off"] == 2
    assert result["pto_days_used"] == 1


def test_score_window_yield_score():
    start = date(2026, 6, 5)  # Friday
    result = _score_window(start, 2, set())
    assert math.isclose(result["yield_score"], 2.0)


# Helper function to make the state for the planner tests
def _make_state(preferred_months=None):
    return {
        "request": TripPlannerRequest(
            departure="JFK",
            destination="NRT",
            pto_days_remaining=3,
            preferred_months=preferred_months,
        ),
        "candidate_windows": [],
        "enriched_windows": [],
        "recommendations": [],
        "user_feedback": None,
        "refinement_count": 0,
    }


async def test_planner_no_preferred_months_returns_windows():
    with patch(
        "app.internal.agents.planner.get_public_holidays",
        new=AsyncMock(return_value=[]),
    ):
        result = await planner_node(_make_state())
    assert "candidate_windows" in result
    assert len(result["candidate_windows"]) <= 15


async def test_planner_preferred_months_filters_to_matching_months():
    with patch(
        "app.internal.agents.planner.get_public_holidays",
        new=AsyncMock(return_value=[]),
    ):
        result = await planner_node(_make_state(preferred_months=[6]))
    for w in result["candidate_windows"]:
        start_month = date.fromisoformat(w["start_date"]).month
        end_month = date.fromisoformat(w["end_date"]).month
        assert start_month == 6 or end_month == 6


async def test_planner_preferred_months_no_matching_windows_returns_empty():
    # Feb 2026 is past; with 3 PTO days, year-end windows spill into Jan 2027 at most
    with patch(
        "app.internal.agents.planner.get_public_holidays",
        new=AsyncMock(return_value=[]),
    ):
        result = await planner_node(_make_state(preferred_months=[2]))
    assert result["candidate_windows"] == []
