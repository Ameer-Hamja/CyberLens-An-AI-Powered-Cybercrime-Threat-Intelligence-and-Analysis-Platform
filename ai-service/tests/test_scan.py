from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_scan_upi_fraud_sms():
    response = client.post("/scan", json={"input_text": "Send money to scammer@okaxis urgently"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["risk_score"] >= 60
    assert data["is_dangerous"] is True
    assert data["threat_type"] == "UPI_FRAUD"

def test_scan_safe_text():
    response = client.post("/scan", json={"input_text": "Hi mom, I will be home late today."})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["risk_score"] < 40
    assert data["is_dangerous"] is False

def test_scan_suspicious_url():
    response = client.post("/scan", json={"input_text": "http://192.168.1.1/login"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert any("raw IP address" in ind for ind in data["indicators"])

def test_scan_validates_empty_input():
    response = client.post("/scan", json={"input_text": "   "})
    assert response.status_code == 422

def test_shield_url_contract():
    response = client.post('/scan/url', json={'url': 'https://example.com'})
    assert response.status_code == 200
    data = response.json()['data']
    assert data['verdict'] in {'SAFE', 'SUSPICIOUS', 'DANGEROUS'}
    assert 0 <= data['score'] <= 100
    assert isinstance(data['reasons'], list)
    assert data['category']

def test_shield_text_contract():
    response = client.post('/scan/text', json={'text': 'Your bank KYC has expired. Share your OTP urgently.'})
    assert response.status_code == 200
    data = response.json()['data']
    assert data['score'] >= 30
    assert data['reasons']

def test_shield_url_rejects_non_http():
    assert client.post('/scan/url', json={'url':'javascript:alert(1)'}).status_code == 422
