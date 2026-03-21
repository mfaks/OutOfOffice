import httpx
import pytest
import respx

from app.internal.agents.tools.flights import search_flights

MOCK_SERPAPI_RESPONSE = {
    "best_flights": [
        {
            "price": 450,
            "flights": [
                {
                    "airline": "Air France",
                    "departure_airport": {"time": "2026-06-01 08:00"},
                    "arrival_airport": {"time": "2026-06-01 21:00"},
                },
            ],
        },
        {
            "price": 620,
            "flights": [
                {
                    "airline": "Delta",
                    "departure_airport": {"time": "2026-06-01 10:00"},
                    "arrival_airport": {"time": "2026-06-01 23:00"},
                },
                {
                    "airline": "Delta",
                    "departure_airport": {"time": "2026-06-01 18:00"},
                    "arrival_airport": {"time": "2026-06-08 09:00"},
                },
            ],
        },
    ],
    "other_flights": [],
}


@pytest.mark.asyncio
@respx.mock
async def test_search_flights_returns_sorted_by_price():
    respx.get("https://serpapi.com/search").mock(
        return_value=httpx.Response(200, json=MOCK_SERPAPI_RESPONSE)
    )

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    assert len(results) == 2
    assert results[0]["estimated_flight_cost"] == 450
    assert results[1]["estimated_flight_cost"] == 620


@pytest.mark.asyncio
@respx.mock
async def test_search_flights_result_shape():
    respx.get("https://serpapi.com/search").mock(
        return_value=httpx.Response(200, json=MOCK_SERPAPI_RESPONSE)
    )

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    flight = results[0]
    assert flight["airline"] == "Air France"
    assert flight["layovers"] == 0
    assert "departs_at" in flight
    assert "returns_at" in flight


@pytest.mark.asyncio
@respx.mock
async def test_search_flights_budget_filter():
    respx.get("https://serpapi.com/search").mock(
        return_value=httpx.Response(200, json=MOCK_SERPAPI_RESPONSE)
    )

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
        max_budget=500.0,
    )

    assert len(results) == 1
    assert results[0]["estimated_flight_cost"] == 450


@pytest.mark.asyncio
@respx.mock
async def test_search_flights_counts_layovers():
    respx.get("https://serpapi.com/search").mock(
        return_value=httpx.Response(200, json=MOCK_SERPAPI_RESPONSE)
    )

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    assert results[1]["layovers"] == 1


@pytest.mark.asyncio
@respx.mock
async def test_search_flights_http_error_raises():
    respx.get("https://serpapi.com/search").mock(return_value=httpx.Response(500))

    with pytest.raises(httpx.HTTPStatusError):
        await search_flights(
            origin="JFK",
            destination="CDG",
            departure_date="2026-06-01",
            return_date="2026-06-08",
        )
