import asyncio

from app.internal.agents.tools.flights import search_flights
from app.schemas.trip import TripState


async def travel_node(state: TripState) -> dict:
    """travel_node adds cheapest flight per window; drops windows with no flights."""

    request = state["request"]
    candidate_windows = state["candidate_windows"]

    all_flights = await asyncio.gather(
        *[
            search_flights(
                origin=request.departure,
                destination=request.destination,
                departure_date=window["start_date"],
                return_date=window["end_date"],
                max_budget=request.max_flight_budget,
            )
            for window in candidate_windows
        ]
    )

    enriched = [
        {**window, "best_flight": flights[0]}
        for window, flights in zip(candidate_windows, all_flights)
        if flights
    ]

    return {"enriched_windows": enriched}
