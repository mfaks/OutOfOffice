from datetime import date, timedelta

from app.internal.agents.tools.holidays import get_public_holidays
from app.internal.models import TripState


async def planner_node(state: TripState) -> dict:
    """
    Node 1 (API)

    Fetches public holidays, combines them with company holidays,
    then scores every possible PTO window by yield score.
    Yield score = total_days_off / pto_days_used.
    Returns the top 5 windows to pass to the travel node.
    """

    request = state["request"]

    year = date.today().year
    public_holidays = await get_public_holidays(country_code="US", year=year)

    # combine the public holidays and company holidays into one set
    all_holidays: set[str] = set()
    for h in public_holidays:
        all_holidays.add(h["date"])
    for h in request.company_holidays or []:
        all_holidays.add(h)

    # score every window within the PTO budget
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

    windows.sort(key=lambda w: w["yield_score"], reverse=True)
    return {"candidate_windows": windows[:5]}


def _score_window(
    start: date,
    pto_budget: int,
    holidays: set[str],
) -> dict | None:
    """
    Given a start date and PTO budget, walk forward day by day.
    Weekends and holidays are free; weekdays cost one PTO day.
    Returns the window dict once the PTO budget is spent.
    """
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
