REGISTER_A = {
    "email": "tripa@example.com",
    "password": "secret123",
    "first_name": "Trip",
    "last_name": "UserA",
}

REGISTER_B = {
    "email": "tripb@example.com",
    "password": "secret123",
    "first_name": "Trip",
    "last_name": "UserB",
}

RECOMMENDATION = {
    "rank": 1,
    "start_date": "2026-07-04",
    "end_date": "2026-07-08",
    "total_days_off": 5,
    "pto_days_used": 3,
    "yield_score": 1.67,
    "best_flight": {
        "airline": "Delta",
        "estimated_flight_cost": 450.0,
        "layovers": 0,
        "departs_at": "2026-07-04T08:00:00",
        "returns_at": "2026-07-08T18:00:00",
    },
    "reasoning": "Great summer timing.",
}

SAVE_BODY = {
    "departure": "JFK",
    "destination": "CDG",
    "recommendation": RECOMMENDATION,
}


def _register_and_token(client, payload=REGISTER_A) -> str:
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/login", json=payload)
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _set_pto(client, token: str, pto: int):
    client.put(
        "/me/preferences", json={"pto_days_remaining": pto}, headers=_auth(token)
    )


# ── POST /me/trips ──────────────────────────────────────────────────────────


def test_save_trip_unauthenticated_returns_401(client):
    resp = client.post("/me/trips", json=SAVE_BODY)
    assert resp.status_code == 401


def test_save_trip_returns_201_with_id(client):
    token = _register_and_token(client)
    resp = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token))
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["departure"] == "JFK"
    assert data["destination"] == "CDG"
    assert data["pto_days_used"] == 3


def test_save_trip_deducts_pto(client):
    token = _register_and_token(client)
    _set_pto(client, token, 10)
    client.post("/me/trips", json=SAVE_BODY, headers=_auth(token))
    prefs = client.get("/me/preferences", headers=_auth(token)).json()
    assert prefs["pto_days_remaining"] == 7


def test_save_trip_fails_when_insufficient_pto(client):
    token = _register_and_token(client)
    _set_pto(client, token, 2)
    resp = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token))
    assert resp.status_code == 422
    assert "PTO" in resp.json()["detail"]


def test_save_trip_succeeds_when_pto_is_null(client):
    token = _register_and_token(client)
    # no preferences set — pto_days_remaining is null
    resp = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token))
    assert resp.status_code == 201


# ── GET /me/trips ────────────────────────────────────────────────────────────


def test_list_trips_unauthenticated_returns_401(client):
    resp = client.get("/me/trips")
    assert resp.status_code == 401


def test_list_trips_returns_empty_for_new_user(client):
    token = _register_and_token(client)
    resp = client.get("/me/trips", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["trips"] == []
    assert data["pto_days_remaining"] is None


def test_list_trips_returns_saved_trips_with_pto_balance(client):
    token = _register_and_token(client)
    _set_pto(client, token, 10)
    client.post("/me/trips", json=SAVE_BODY, headers=_auth(token))
    resp = client.get("/me/trips", headers=_auth(token))
    data = resp.json()
    assert len(data["trips"]) == 1
    assert data["pto_days_remaining"] == 7


# ── GET /me/trips/{trip_id} ──────────────────────────────────────────────────


def test_get_trip_by_id_returns_correct_trip(client):
    token = _register_and_token(client)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token)).json()
    resp = client.get(f"/me/trips/{saved['id']}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["id"] == saved["id"]


def test_get_trip_by_id_returns_404_for_nonexistent(client):
    token = _register_and_token(client)
    resp = client.get("/me/trips/99999", headers=_auth(token))
    assert resp.status_code == 404


def test_get_trip_by_id_returns_403_for_other_users_trip(client):
    token_a = _register_and_token(client, REGISTER_A)
    token_b = _register_and_token(client, REGISTER_B)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token_a)).json()
    resp = client.get(f"/me/trips/{saved['id']}", headers=_auth(token_b))
    assert resp.status_code == 403


# ── DELETE /me/trips/{trip_id} ───────────────────────────────────────────────


def test_delete_trip_returns_204(client):
    token = _register_and_token(client)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token)).json()
    resp = client.delete(f"/me/trips/{saved['id']}", headers=_auth(token))
    assert resp.status_code == 204


def test_delete_trip_restores_pto(client):
    token = _register_and_token(client)
    _set_pto(client, token, 10)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token)).json()
    assert (
        client.get("/me/preferences", headers=_auth(token)).json()["pto_days_remaining"]
        == 7
    )
    client.delete(f"/me/trips/{saved['id']}", headers=_auth(token))
    assert (
        client.get("/me/preferences", headers=_auth(token)).json()["pto_days_remaining"]
        == 10
    )


def test_delete_trip_with_null_pto_does_not_error(client):
    token = _register_and_token(client)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token)).json()
    resp = client.delete(f"/me/trips/{saved['id']}", headers=_auth(token))
    assert resp.status_code == 204


def test_delete_trip_returns_403_for_other_user(client):
    token_a = _register_and_token(client, REGISTER_A)
    token_b = _register_and_token(client, REGISTER_B)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token_a)).json()
    resp = client.delete(f"/me/trips/{saved['id']}", headers=_auth(token_b))
    assert resp.status_code == 403


def test_delete_trip_removes_from_list(client):
    token = _register_and_token(client)
    saved = client.post("/me/trips", json=SAVE_BODY, headers=_auth(token)).json()
    client.delete(f"/me/trips/{saved['id']}", headers=_auth(token))
    data = client.get("/me/trips", headers=_auth(token)).json()
    assert data["trips"] == []
