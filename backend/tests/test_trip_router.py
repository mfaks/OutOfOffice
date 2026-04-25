from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock

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


# Mock snapshot for testing
class _MockSnapshot:
    values = MOCK_STATE


# Empty snapshot for testing
class _EmptySnapshot:
    values = {}


# Patch the graph for testing
@contextmanager
def _graph_patch(client, *, empty_session=False):
    mock_graph = MagicMock()
    mock_graph.ainvoke = AsyncMock(return_value=MOCK_STATE)
    mock_graph.aupdate_state = AsyncMock()
    snapshot = _EmptySnapshot() if empty_session else _MockSnapshot()
    mock_graph.aget_state = AsyncMock(return_value=snapshot)
    client.app.state.graph = mock_graph
    try:
        yield mock_graph
    finally:
        del client.app.state.graph


# Check if the create trip endpoint returns a 200 status code
def test_create_trip_returns_200(client):
    with _graph_patch(client):
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    assert response.status_code == 200


# Check if the create trip endpoint returns the response with the correct shape
def test_create_trip_response_shape(client):
    with _graph_patch(client):
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert "thread_id" in data
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data
    assert isinstance(data["recommendations"], list)


# Check if the create trip endpoint sends the request to the graph
def test_create_trip_echoes_request(client):
    with _graph_patch(client):
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert data["request"]["departure"] == VALID_TRIP_REQUEST["departure"]
    assert data["request"]["destination"] == VALID_TRIP_REQUEST["destination"]
    assert (
        data["request"]["pto_days_remaining"]
        == VALID_TRIP_REQUEST["pto_days_remaining"]
    )


# Check if the create trip endpoint returns a thread ID
def test_create_trip_returns_thread_id(client):
    with _graph_patch(client):
        response = client.post("/api/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert isinstance(data["thread_id"], str)
    assert len(data["thread_id"]) > 0


# Check if the create trip endpoint returns a 422 status code if the PTO days are invalid
def test_create_trip_invalid_pto_days(client):
    payload = dict(VALID_TRIP_REQUEST)
    payload["pto_days_remaining"] = 0
    response = client.post("/api/trip", json=payload)
    assert response.status_code == 422


# Check if the create trip endpoint returns a 422 status code if the required fields are missing
def test_create_trip_missing_required_fields(client):
    response = client.post("/api/trip", json={"destination": "CDG"})
    assert response.status_code == 422


# Check if the feedback endpoint returns a 200 status code
def test_feedback_returns_200(client):
    with _graph_patch(client):
        response = client.post(
            "/api/trips/some-thread-id/feedback",
            json={"feedback": "find cheaper options"},
        )
    assert response.status_code == 200


# Check if the feedback endpoint returns the response with the correct shape
def test_feedback_response_shape(client):
    with _graph_patch(client):
        response = client.post(
            "/api/trips/some-thread-id/feedback",
            json={"feedback": "find cheaper options"},
        )
    data = response.json()
    assert "thread_id" in data
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data


# Check if the feedback endpoint sends the thread ID to the graph
def test_feedback_echoes_thread_id(client):
    thread_id = "test-thread-123"
    with _graph_patch(client):
        response = client.post(
            f"/api/trips/{thread_id}/feedback",
            json={"feedback": "too expensive"},
        )
    data = response.json()
    assert data["thread_id"] == thread_id


# Check if the feedback endpoint returns a 404 status code if the session is not found
def test_feedback_session_not_found(client):
    with _graph_patch(client, empty_session=True):
        response = client.post(
            "/api/trips/nonexistent-thread/feedback",
            json={"feedback": "cheaper"},
        )
    assert response.status_code == 404
