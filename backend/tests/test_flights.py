import httpx
import pytest
import respx

from app.internal.agents.tools.flights import search_flights

MOCK_OUTBOUND_RESPONSE = {
    "best_flights": [
        {
            "price": 250,
            "flights": [
                {
                    "airline": "Air France",
                    "departure_airport": {"time": "2026-06-01 08:00"},
                    "arrival_airport": {"time": "2026-06-01 21:00"},
                },
            ],
        },
        {
            "price": 370,
            "flights": [
                {
                    "airline": "Delta",
                    "departure_airport": {"time": "2026-06-01 10:00"},
                    "arrival_airport": {"time": "2026-06-01 20:00"},
                },
                {
                    "airline": "Delta",
                    "departure_airport": {"time": "2026-06-01 21:30"},
                    "arrival_airport": {"time": "2026-06-02 09:00"},
                },
            ],
        },
    ],
    "other_flights": [],
}

MOCK_RETURN_RESPONSE = {
    "best_flights": [
        {
            "price": 200,
            "flights": [
                {
                    "airline": "Air France",
                    "departure_airport": {"time": "2026-06-08 14:00"},
                    "arrival_airport": {"time": "2026-06-08 17:30"},
                },
            ],
        },
    ],
    "other_flights": [],
}


# Helper function to mock the outbound and return responses
def _mock_both():
    call_count = {"n": 0}
    responses = [MOCK_OUTBOUND_RESPONSE, MOCK_RETURN_RESPONSE]

    def _side_effect(request):
        resp = responses[call_count["n"] % 2]
        call_count["n"] += 1
        return httpx.Response(200, json=resp)

    return respx.get("https://serpapi.com/search").mock(side_effect=_side_effect)


# Check if the search flights function returns the flights sorted by price
@pytest.mark.asyncio
@respx.mock
async def test_search_flights_returns_sorted_by_price():
    _mock_both()

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    assert len(results) == 2
    assert results[0]["estimated_flight_cost"] == 450  # 250 + 200
    assert results[1]["estimated_flight_cost"] == 570  # 370 + 200


# Check if the search flights function returns the flights with the correct shape
@pytest.mark.asyncio
@respx.mock
async def test_search_flights_result_shape():
    _mock_both()

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    flight = results[0]
    assert flight["airline"] == "Air France / Air France"
    assert flight["layovers"] == 0
    assert flight["outbound_departs_at"] == "2026-06-01 08:00"
    assert flight["outbound_arrives_at"] == "2026-06-01 21:00"
    assert flight["return_departs_at"] == "2026-06-08 14:00"
    assert flight["return_arrives_at"] == "2026-06-08 17:30"


# Check if the search flights function returns the flights with the correct shape
@pytest.mark.asyncio
@respx.mock
async def test_search_flights_budget_filter():
    _mock_both()

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
        max_budget=500.0,
    )

    assert len(results) == 1
    assert results[0]["estimated_flight_cost"] == 450


# Check if the search flights function returns the flights with the correct shape
@pytest.mark.asyncio
@respx.mock
async def test_search_flights_counts_layovers():
    _mock_both()

    results = await search_flights(
        origin="JFK",
        destination="CDG",
        departure_date="2026-06-01",
        return_date="2026-06-08",
    )

    assert results[1]["layovers"] == 1


# Check if the search flights function raises an error if the HTTP error is 500
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
