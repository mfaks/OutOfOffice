REGISTER_PAYLOAD = {
    "email": "test@example.com",
    "password": "secret123",
    "first_name": "Test",
    "last_name": "User",
}


def test_register_creates_user(client):
    response = client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == REGISTER_PAYLOAD["email"]
    assert data["first_name"] == REGISTER_PAYLOAD["first_name"]
    assert data["last_name"] == REGISTER_PAYLOAD["last_name"]
    assert "id" in data


def test_register_duplicate_email_returns_400(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 400


def test_login_returns_token(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post("/auth/login", json=REGISTER_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post(
        "/auth/login",
        json={**REGISTER_PAYLOAD, "password": "wrongpass"},
    )
    assert response.status_code == 401


def test_login_unknown_email_returns_401(client):
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "anything"},
    )
    assert response.status_code == 401
