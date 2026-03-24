from app.internal.agents.tools.flights import search_flights
from app.schemas.trip import TripState


async def travel_node(state: TripState) -> dict:
    """Attach the cheapest viable flight to each candidate window; drop windows with no
    flights."""

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

        if not flights:
            continue

        enriched.append(
            {
                **window,
                "best_flight": flights[0],
            }
        )

    return {"enriched_windows": enriched}
