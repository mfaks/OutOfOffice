from unittest.mock import AsyncMock, patch

from app.internal.models import FlightOption, TripRecommendation
from tests.conftest import VALID_TRIP_REQUEST

MOCK_RECOMMENDATION = TripRecommendation(
    rank=1,
    start_date="2026-05-23",
    end_date="2026-05-26",
    total_days_off=4,
    pto_days_used=2,
    yield_score=2.0,
    best_flight=FlightOption(
        airline="Air France",
        estimated_flight_cost=650.0,
        layovers=0,
        departs_at="2026-05-23 08:00",
        returns_at="2026-05-26 18:00",
    ),
    reasoning="Good yield score and cheap direct flight.",
)


def _pipeline_patches():
    return [
        patch(
            "app.internal.agents.travel.search_flights",
            new=AsyncMock(return_value=[MOCK_RECOMMENDATION.best_flight.model_dump()]),
        ),
        patch(
            "app.internal.agents.pipeline.ranker_node",
            new=AsyncMock(return_value=[MOCK_RECOMMENDATION]),
        ),
    ]


def test_create_trip_returns_200(client):
    with _pipeline_patches()[0], _pipeline_patches()[1]:
        response = client.post("/trip", json=VALID_TRIP_REQUEST)
    assert response.status_code == 200


def test_create_trip_response_shape(client):
    with _pipeline_patches()[0], _pipeline_patches()[1]:
        response = client.post("/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data
    assert isinstance(data["recommendations"], list)


def test_create_trip_echoes_request(client):
    with _pipeline_patches()[0], _pipeline_patches()[1]:
        response = client.post("/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert data["request"]["departure"] == VALID_TRIP_REQUEST["departure"]
    assert data["request"]["destination"] == VALID_TRIP_REQUEST["destination"]
    assert (
        data["request"]["pto_days_remaining"]
        == VALID_TRIP_REQUEST["pto_days_remaining"]
    )


def test_create_trip_invalid_pto_days(client):
    payload = {**VALID_TRIP_REQUEST, "pto_days_remaining": 0}
    response = client.post("/trip", json=payload)
    assert response.status_code == 422


def test_create_trip_missing_required_fields(client):
    response = client.post("/trip", json={"destination": "CDG"})
    assert response.status_code == 422
