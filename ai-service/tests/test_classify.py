from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_classify_returns_valid_response():
    response = client.post("/classify", json={"text": "Click here to verify your KYC before account gets suspended"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    data = response.json()["data"]
    assert "threat_type" in data
    assert "severity" in data

def test_classify_rejects_short_text():
    response = client.post("/classify", json={"text": "short"})
    assert response.status_code == 422

def test_benign_classification_severity_matches_database_constraint():
    response = client.post("/classify/", json={"text": "Test ingestion triggered by admin for source: MANUAL"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["threat_type"] == "OTHER"
    assert 1 <= data["severity"] <= 5

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
