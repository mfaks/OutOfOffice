from contextlib import ExitStack
from unittest.mock import AsyncMock, patch

from app.schemas.trip import FlightOption, TripPlannerRequest, TripRecommendation
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
        outbound_departs_at="2026-05-23 08:00",
        outbound_arrives_at="2026-05-23 21:00",
        return_departs_at="2026-05-26 14:00",
        return_arrives_at="2026-05-26 18:00",
    ),
    reasoning="Good yield score and cheap direct flight.",
)

MOCK_STATE = {
    "request": TripPlannerRequest(**VALID_TRIP_REQUEST),
    "candidate_windows": [],
    "enriched_windows": [],
    "recommendations": [MOCK_RECOMMENDATION],
    "user_feedback": None,
    "refinement_count": 0,
}


class _MockSnapshot:
    values = MOCK_STATE


def _graph_patch():
    stack = ExitStack()
    stack.enter_context(
        patch("app.routers.trip.graph.ainvoke", new=AsyncMock(return_value=MOCK_STATE))
    )
    stack.enter_context(
        patch(
            "app.routers.trip.graph.aget_state",
            new=AsyncMock(return_value=_MockSnapshot()),
        )
    )
    return stack


def test_create_trip_returns_200(client):
    with _graph_patch():
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    assert response.status_code == 200


def test_create_trip_response_shape(client):
    with _graph_patch():
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert "thread_id" in data
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data
    assert isinstance(data["recommendations"], list)


def test_create_trip_echoes_request(client):
    with _graph_patch():
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert data["request"]["departure"] == VALID_TRIP_REQUEST["departure"]
    assert data["request"]["destination"] == VALID_TRIP_REQUEST["destination"]
    assert (
        data["request"]["pto_days_remaining"]
        == VALID_TRIP_REQUEST["pto_days_remaining"]
    )


def test_create_trip_returns_thread_id(client):
    with _graph_patch():
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert isinstance(data["thread_id"], str)
    assert len(data["thread_id"]) > 0


def test_create_trip_invalid_pto_days(client):
    payload = {**VALID_TRIP_REQUEST, "pto_days_remaining": 0}
    response = client.post("/api/trip", json=payload)
    assert response.status_code == 422


def test_create_trip_missing_required_fields(client):
    response = client.post("/api/trip", json={"destination": "CDG"})
    assert response.status_code == 422


def test_feedback_returns_200(client):
    with _graph_patch():
        response = client.post(
            "/api/trips/some-thread-id/feedback?feedback=find+cheaper+options"
        )
    assert response.status_code == 200


def test_feedback_response_shape(client):
    with _graph_patch():
        response = client.post(
            "/api/trips/some-thread-id/feedback?feedback=find+cheaper+options"
        )
    data = response.json()
    assert "thread_id" in data
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data


def test_feedback_echoes_thread_id(client):
    thread_id = "test-thread-123"
    with _graph_patch():
        response = client.post(
            f"/api/trips/{thread_id}/feedback?feedback=too+expensive"
        )
    data = response.json()
    assert data["thread_id"] == thread_id
