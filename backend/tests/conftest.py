import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


VALID_TRIP_REQUEST = {
    "departure": "JFK",
    "destination": "CDG",
    "pto_days_remaining": 5,
    "max_flight_budget": 1000.0,
    "company_holidays": [],
}
