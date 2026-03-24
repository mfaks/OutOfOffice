from datetime import date, timedelta

from app.internal.agents.tools.holidays import get_public_holidays
from app.schemas.trip import TripPriority, TripState


async def planner_node(state: TripState) -> dict:
    """Score every PTO window by yield (days_off / pto_used) and return the top 5."""

    request = state["request"]

    year = date.today().year
    public_holidays = await get_public_holidays(country_code="US", year=year)

    all_holidays: set[str] = set()
    for h in public_holidays:
        all_holidays.add(h["date"])
    for h in request.company_holidays or []:
        all_holidays.add(h)

    windows = []
    today = date.today()
    year_end = date(year, 12, 31)

    for start_offset in range((year_end - today).days):
        start = today + timedelta(days=start_offset)
        for pto_days in range(1, request.pto_days_remaining + 1):
            window = _score_window(start, pto_days, all_holidays)
            if window:
                windows.append(window)

    if request.min_pto_days:
        windows = [w for w in windows if w["pto_days_used"] >= request.min_pto_days]

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
        # best_yield and lowest_cost both start with highest-yield candidates;
        # lowest_cost final ranking is handled by the ranker after prices are known
        windows.sort(key=lambda w: w["yield_score"], reverse=True)

    return {"candidate_windows": windows[:15]}


def _score_window(
    start: date,
    pto_budget: int,
    holidays: set[str],
) -> dict | None:
    """Walk forward from start, consuming one PTO day per weekday/non-holiday,
    until budget is spent."""
    pto_used = 0
    current = start
    total_days = 0

    while pto_used < pto_budget:
        is_weekend = current.weekday() >= 5
        is_holiday = current.isoformat() in holidays

        total_days += 1
        if not is_weekend and not is_holiday:
            pto_used += 1

        current += timedelta(days=1)

    if pto_used == 0:
        return None

    return {
        "start_date": start.isoformat(),
        "end_date": (current - timedelta(days=1)).isoformat(),
        "total_days_off": total_days,
        "pto_days_used": pto_used,
        "yield_score": round(total_days / pto_used, 2),
    }
