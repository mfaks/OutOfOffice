import asyncio

from app.internal.agents.tools.flights import search_flights
from app.schemas.trip import TripState


# Search flights for each candidate window in parallel and attach the cheapest result
async def travel_node(state: TripState) -> dict:

    request = state["request"]
    candidate_windows = state["candidate_windows"]

    tasks = []
    for window in candidate_windows:
        tasks.append(
            search_flights(
                origin=request.departure,
                destination=request.destination,
                departure_date=window["start_date"],
                return_date=window["end_date"],
                max_budget=request.max_flight_budget,
            )
        )
    all_flights = await asyncio.gather(*tasks)

    enriched = []
    for window, flights in zip(candidate_windows, all_flights):
        if flights:
            enriched.append(window | {"best_flight": flights[0]})

    return {"enriched_windows": enriched}
