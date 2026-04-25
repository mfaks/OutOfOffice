from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.limiter import limiter
from app.main import app

# Valid trip request for testing
VALID_TRIP_REQUEST = {
    "departure": "JFK",
    "destination": "CDG",
    "pto_days_remaining": 5,
    "max_flight_budget": 1000.0,
    "company_holidays": [],
}

# Function to bypass the rate limit in tests
def _bypass_rate_limit(request, endpoint_func, in_middleware=True):
    request.state.view_rate_limit = None

# Fixture to set up environment and bypass the rate limit in tests
@pytest.fixture
def client():
    with patch.object(limiter, "_check_request_limit", side_effect=_bypass_rate_limit):
        yield TestClient(app)
