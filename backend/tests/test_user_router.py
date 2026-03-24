REGISTER_PAYLOAD = {
    "email": "prefs@example.com",
    "password": "secret123",
    "first_name": "Prefs",
    "last_name": "User",
}


def _register_and_token(client) -> str:
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    resp = client.post("/auth/login", json=REGISTER_PAYLOAD)
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_get_preferences_unauthenticated_returns_401(client):
    response = client.get("/me/preferences")
    assert response.status_code == 401


def test_put_preferences_unauthenticated_returns_401(client):
    response = client.put("/me/preferences", json={})
    assert response.status_code == 401


def test_get_preferences_returns_empty_defaults_for_new_user(client):
    token = _register_and_token(client)
    response = client.get("/me/preferences", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["pto_days_remaining"] is None
    assert data["max_flight_budget"] is None
    assert data["default_departure"] is None
    assert data["default_destination"] is None
    assert data["company_holidays"] == []
    assert data["preferred_months"] == []


def test_put_preferences_returns_200(client):
    token = _register_and_token(client)
    response = client.put("/me/preferences", json={}, headers=_auth(token))
    assert response.status_code == 200


def test_put_preferences_persists_pto_and_budget(client):
    token = _register_and_token(client)
    client.put(
        "/me/preferences",
        json={"pto_days_remaining": 10, "max_flight_budget": 800.0},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["pto_days_remaining"] == 10
    assert data["max_flight_budget"] == 800.0


def test_put_preferences_persists_airports(client):
    token = _register_and_token(client)
    client.put(
        "/me/preferences",
        json={"default_departure": "JFK", "default_destination": "NRT"},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["default_departure"] == "JFK"
    assert data["default_destination"] == "NRT"


def test_put_preferences_persists_company_holidays(client):
    token = _register_and_token(client)
    holidays = ["2026-07-04", "2026-12-25"]
    client.put(
        "/me/preferences",
        json={"company_holidays": holidays},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["company_holidays"] == holidays


def test_put_preferences_persists_preferred_months(client):
    token = _register_and_token(client)
    client.put(
        "/me/preferences",
        json={"preferred_months": [6, 7, 8]},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["preferred_months"] == [6, 7, 8]


def test_put_preferences_overwrites_previous_values(client):
    token = _register_and_token(client)
    client.put(
        "/me/preferences",
        json={"pto_days_remaining": 5},
        headers=_auth(token),
    )
    client.put(
        "/me/preferences",
        json={"pto_days_remaining": 15},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["pto_days_remaining"] == 15


def test_put_preferences_clears_field_when_null(client):
    token = _register_and_token(client)
    client.put(
        "/me/preferences",
        json={"default_departure": "JFK"},
        headers=_auth(token),
    )
    client.put(
        "/me/preferences",
        json={"default_departure": None},
        headers=_auth(token),
    )
    data = client.get("/me/preferences", headers=_auth(token)).json()
    assert data["default_departure"] is None
