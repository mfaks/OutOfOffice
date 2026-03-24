import httpx

from app.config import settings


async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    max_budget: float | None = None,
) -> list[dict]:
    """Search round-trip flights via SerpApi and return options sorted by price."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://serpapi.com/search",
            params={
                "engine": "google_flights",
                "departure_id": origin,
                "arrival_id": destination,
                "outbound_date": departure_date,
                "return_date": return_date,
                "currency": "USD",
                "type": "1",
                "api_key": settings.serpapi_api_key,
            },
        )
        response.raise_for_status()
        data = response.json()

    flights = []
    raw_flights = data.get("best_flights", []) + data.get("other_flights", [])

    for offer in raw_flights:
        price = float(offer.get("price", 0))
        if max_budget and price > max_budget:
            continue

        first_leg = offer["flights"][0]
        last_leg = offer["flights"][-1]
        layovers = len(offer["flights"]) - 1

        flights.append(
            {
                "airline": first_leg["airline"],
                "estimated_flight_cost": price,
                "layovers": layovers,
                "departs_at": first_leg["departure_airport"]["time"],
                "returns_at": last_leg["arrival_airport"]["time"],
            }
        )

    return sorted(flights, key=lambda f: f["estimated_flight_cost"])
