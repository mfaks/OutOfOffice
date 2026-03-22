from datetime import date

from app.internal.agents.planner import _score_window


def test_score_window_basic():
    # Monday start, 2 PTO days, no holidays -> 2 weekdays consumed
    start = date(2026, 6, 1)  # Monday
    result = _score_window(start, 2, set())
    assert result is not None
    assert result["pto_days_used"] == 2
    assert result["start_date"] == "2026-06-01"


def test_score_window_weekend_is_free():
    # Friday start, 2 PTO days: Fri (pto=1), Sat (free), Sun (free), Mon (pto=2)
    # -> 4 total days off for 2 PTO days
    start = date(2026, 6, 5)  # Friday
    result = _score_window(start, 2, set())
    assert result is not None
    assert result["pto_days_used"] == 2
    assert result["total_days_off"] == 4


def test_score_window_holiday_is_free():
    # Monday start, holiday on Monday, 1 PTO day
    # Monday is free so Tuesday costs the PTO day -> 2 total days
    start = date(2026, 6, 1)  # Monday
    holidays = {"2026-06-01"}
    result = _score_window(start, 1, holidays)
    assert result is not None
    assert result["total_days_off"] == 2
    assert result["pto_days_used"] == 1


def test_score_window_yield_score():
    # Friday start, 2 PTO days -> 4 days off (Fri + Sat + Sun + Mon) -> yield 2.0
    start = date(2026, 6, 5)  # Friday
    result = _score_window(start, 2, set())
    assert result["yield_score"] == 2.0
