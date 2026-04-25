import asyncio

import httpx

from app.config import settings


# Helper function to fetch one-way flights from SerpApi because SerpApi doesn't support round-trip flights
async def _fetch_one_way(
    client: httpx.AsyncClient,
    origin: str,
    destination: str,
    date: str,
) -> list[dict]:

    # SerpApi API call to fetch flights
    response = await client.get(
        "https://serpapi.com/search",
        params={
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": date,
            "currency": "USD",
            "type": "2",
            "api_key": settings.serpapi_api_key,
        },
    )
    response.raise_for_status()
    data = response.json()

    # Parse the response and extract the flights
    flights = []
    for offer in data.get("best_flights", []) + data.get("other_flights", []):
        first_leg = offer["flights"][0]
        last_leg = offer["flights"][-1]
        flights.append(
            {
                "airline": first_leg["airline"],
                "price": float(offer.get("price", 0)),
                "layovers": len(offer["flights"]) - 1,
                "departs_at": first_leg["departure_airport"]["time"],
                "arrives_at": last_leg["arrival_airport"]["time"],
            }
        )

    # Sort flights by lowest price
    return sorted(flights, key=lambda f: f["price"])


# Main function to search for round-trip flights
async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    max_budget: float | None = None,
) -> list[dict]:

    # Make two one-way API calls to SerpApi to get outbound and return flights
    async with httpx.AsyncClient(timeout=30.0) as client:
        outbound_flights, return_flights = await asyncio.gather(
            _fetch_one_way(client, origin, destination, departure_date),
            _fetch_one_way(client, destination, origin, return_date),
        )

    # If no flights are found, return an empty list
    if not outbound_flights or not return_flights:
        return []

    # Combine the outbound and return flights into a single list of round-trip flights
    flights = []
    for out in outbound_flights:
        for ret in return_flights:
            total_price = out["price"] + ret["price"]

            # If the total price is greater than the max budget, skip this flight
            if max_budget is not None and total_price > max_budget:
                continue

            # Add the flight to the list
            flights.append(
                {
                    "airline": f"{out['airline']} / {ret['airline']}",
                    "estimated_flight_cost": total_price,
                    "layovers": out["layovers"] + ret["layovers"],
                    "outbound_departs_at": out["departs_at"],
                    "outbound_arrives_at": out["arrives_at"],
                    "return_departs_at": ret["departs_at"],
                    "return_arrives_at": ret["arrives_at"],
                }
            )

    # Sort the flights by estimated flight cost from lowest to highest
    return sorted(flights, key=lambda f: f["estimated_flight_cost"])
