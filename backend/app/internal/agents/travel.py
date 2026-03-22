from app.internal.agents.tools.flights import search_flights
from app.internal.models import TripState


async def travel_node(state: TripState) -> dict:
    """
    Node 2 (API)

    Takes the top 5 windows from planner_node and queries
    SerpApi for each one. Drops any window where no flights
    are found within the budget. Returns enriched windows
    with a best_flight attached to each.
    """

    request = state["request"]
    candidate_windows = state["candidate_windows"]
    enriched = []

    for window in candidate_windows:
        flights = await search_flights(
            origin=request.departure,
            destination=request.destination,
            departure_date=window["start_date"],
            return_date=window["end_date"],
            max_budget=request.max_flight_budget,
        )

        # if there are no viable flights for the window, skip it
        if not flights:
            continue

        enriched.append(
            {
                **window,
                "best_flight": flights[0],
            }
        )

    return {"enriched_windows": enriched}
