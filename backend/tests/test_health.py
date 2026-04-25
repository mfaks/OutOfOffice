from unittest.mock import patch


# Check if the health endpoint returns a 200 status code with the correct body
def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# Check if the health endpoint returns a 500 status code when the handler raises an exception
def test_health_returns_500_on_error(client):
    with patch("app.routers.health.health", side_effect=Exception("server error")):
        response = client.get("/health")
    assert response.status_code == 500
