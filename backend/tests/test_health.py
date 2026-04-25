# Check if the health endpoint returns a 200 status code with the correct body
def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
