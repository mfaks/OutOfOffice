import asyncio
from datetime import date, timedelta

from app.internal.agents.tools.holidays import get_public_holidays
from app.schemas.trip import TripPriority, TripState


# Planner agent to score PTO windows by yield
async def planner_node(state: TripState) -> dict:

    request = state["request"]

    year = date.today().year
    # fetch both years so late-December windows that spill into January are correct
    current_holidays, next_year_holidays = await asyncio.gather(
        get_public_holidays(country_code="US", year=year),
        get_public_holidays(country_code="US", year=year + 1),
    )
    public_holidays = current_holidays + next_year_holidays

    # Combine the public holidays and the company holidays
    all_holidays: set[str] = set()
    for h in public_holidays:
        all_holidays.add(h["date"])
    for h in request.company_holidays or []:
        all_holidays.add(h)

    # Create a list of windows to score
    windows = []
    today = date.today()
    year_end = date(year, 12, 31)

    # Score the windows
    for start_offset in range((year_end - today).days):
        start = today + timedelta(days=start_offset)
        for pto_days in range(1, request.pto_days_remaining + 1):
            windows.append(_score_window(start, pto_days, all_holidays))

    # If the user is planning for a minimum number of PTO days, filter the windows
    if request.min_pto_days:
        windows = [w for w in windows if w["pto_days_used"] >= request.min_pto_days]

    # If the user has preferred months, filter the windows to only include those months
    if request.preferred_months:
        month_set = set(request.preferred_months)
        windows = [
            w
            for w in windows
            if date.fromisoformat(w["start_date"]).month in month_set
            or date.fromisoformat(w["end_date"]).month in month_set
        ]

    priority = request.priority

    if priority == TripPriority.most_pto:
        windows.sort(key=lambda w: w["pto_days_used"], reverse=True)
    elif priority == TripPriority.least_pto:
        windows.sort(key=lambda w: w["pto_days_used"])
    else:
        # both modes pre-sort by yield; lowest_cost gets its final sort in the ranker
        windows.sort(key=lambda w: w["yield_score"], reverse=True)

    # Return the top 5 windows
    return {"candidate_windows": windows[:5]}


# Helper function to score a PTO window by yield
def _score_window(
    start: date,
    pto_budget: int,
    holidays: set[str],
) -> dict:
    pto_used = 0
    current = start
    total_days = 0

    # Count the total days off and the PTO days used
    while pto_used < pto_budget:
        is_weekend = current.weekday() >= 5
        is_holiday = current.isoformat() in holidays

        total_days += 1
        if not is_weekend and not is_holiday:
            pto_used += 1

        current += timedelta(days=1)

    return {
        "start_date": start.isoformat(),
        "end_date": (current - timedelta(days=1)).isoformat(),
        "total_days_off": total_days,
        "pto_days_used": pto_used,
        "yield_score": round(total_days / pto_used, 2),
    }
