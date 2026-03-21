from tests.conftest import VALID_TRIP_REQUEST


def test_create_trip_returns_200(client):
    response = client.post("/trip", json=VALID_TRIP_REQUEST)
    assert response.status_code == 200


def test_create_trip_response_shape(client):
    response = client.post("/trip", json=VALID_TRIP_REQUEST)
    data = response.json()
    assert "request" in data
    assert "recommendations" in data
    assert "generated_at" in data
    assert isinstance(data["recommendations"], list)


def test_create_trip_echoes_request(client):
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
