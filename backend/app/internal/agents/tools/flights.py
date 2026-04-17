import httpx

from app.config import settings


async def _fetch_one_way(
    client: httpx.AsyncClient,
    origin: str,
    destination: str,
    date: str,
) -> list[dict]:
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

    legs = []
    for offer in data.get("best_flights", []) + data.get("other_flights", []):
        first_leg = offer["flights"][0]
        last_leg = offer["flights"][-1]
        legs.append(
            {
                "airline": first_leg["airline"],
                "price": float(offer.get("price", 0)),
                "layovers": len(offer["flights"]) - 1,
                "departs_at": first_leg["departure_airport"]["time"],
                "arrives_at": last_leg["arrival_airport"]["time"],
            }
        )
    return sorted(legs, key=lambda f: f["price"])


async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    max_budget: float | None = None,
) -> list[dict]:
    """Search round-trip flights via two one-way SerpApi calls, sorted by price."""
    async with httpx.AsyncClient() as client:
        outbound_legs = await _fetch_one_way(
            client, origin, destination, departure_date
        )
        return_legs = await _fetch_one_way(client, destination, origin, return_date)

    if not outbound_legs or not return_legs:
        return []

    flights = []
    for out in outbound_legs:
        for ret in return_legs:
            total_price = out["price"] + ret["price"]
            if max_budget is not None and total_price > max_budget:
                continue

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

    return sorted(flights, key=lambda f: f["estimated_flight_cost"])
