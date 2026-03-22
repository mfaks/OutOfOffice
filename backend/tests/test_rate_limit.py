from contextlib import ExitStack
from unittest.mock import AsyncMock, patch

from app.schemas.trip import FlightOption, TripPlannerRequest, TripRecommendation
from tests.conftest import VALID_TRIP_REQUEST

_MOCK_RECOMMENDATION = TripRecommendation(
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
    reasoning="Good yield score.",
)

_MOCK_STATE = {
    "request": TripPlannerRequest(**VALID_TRIP_REQUEST),
    "candidate_windows": [],
    "enriched_windows": [],
    "recommendations": [_MOCK_RECOMMENDATION],
    "user_feedback": None,
    "refinement_count": 0,
}


class _MockSnapshot:
    values = _MOCK_STATE


def _graph_patch():
    stack = ExitStack()
    stack.enter_context(
        patch("app.routers.trip.graph.ainvoke", new=AsyncMock(return_value=_MOCK_STATE))
    )
    stack.enter_context(
        patch(
            "app.routers.trip.graph.aget_state",
            new=AsyncMock(return_value=_MockSnapshot()),
        )
    )
    return stack


def test_anon_trip_rate_limit_blocks_second_request(client):
    with _graph_patch():
        first = client.post("/trip", json=VALID_TRIP_REQUEST)
    assert first.status_code == 200

    second = client.post("/trip", json=VALID_TRIP_REQUEST)
    assert second.status_code == 429
    assert "limit" in second.json()["detail"].lower()


def test_anon_refinement_rate_limit_blocks_second_feedback(client):
    with _graph_patch():
        first = client.post("/trips/some-thread/feedback?feedback=cheaper")
    assert first.status_code == 200

    second = client.post("/trips/some-thread/feedback?feedback=cheaper")
    assert second.status_code == 429
    assert "limit" in second.json()["detail"].lower()


def test_authenticated_user_bypasses_refinement_limit(client):
    """Logged-in users get unlimited refinements."""
    from tests.test_auth_router import REGISTER_PAYLOAD

    client.post("/auth/register", json=REGISTER_PAYLOAD)
    login_resp = client.post("/auth/login", json=REGISTER_PAYLOAD)
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with _graph_patch():
        first = client.post(
            "/trips/some-thread/feedback?feedback=cheaper", headers=headers
        )
        second = client.post(
            "/trips/some-thread/feedback?feedback=cheaper", headers=headers
        )
    assert first.status_code == 200
    assert second.status_code == 200
