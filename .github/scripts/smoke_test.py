import os
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import httpx
import pytest


def required_url(name):
    value = os.environ.get(name, "").rstrip("/")
    parsed = urlparse(value)
    assert parsed.scheme == "https" and parsed.netloc, f"{name} must be an HTTPS service URL"
    assert parsed.netloc != "huggingface.co", "AI_URL must be the runtime .hf.space URL"
    return value


BACKEND = required_url("BACKEND_URL")
FRONTEND = required_url("FRONTEND_URL")
AI = required_url("AI_URL")


@pytest.fixture(scope="session")
def client():
    with httpx.Client(timeout=30, follow_redirects=True) as session:
        yield session


def data(response):
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    return body["data"]


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src"):
            self.urls.append(attrs["src"])
        if tag == "link" and attrs.get("rel") == "stylesheet" and attrs.get("href"):
            self.urls.append(attrs["href"])


def test_frontend_and_assets(client):
    response = client.get(FRONTEND)
    assert response.status_code == 200
    assert "crimelens" in response.text.lower()
    parser = Assets()
    parser.feed(response.text)
    assert parser.urls, "Frontend has no JS or CSS assets"
    for asset in parser.urls:
        response = client.get(urljoin(FRONTEND + "/", asset))
        assert response.status_code == 200
        assert "text/html" not in response.headers.get("content-type", "")


def test_backend_health(client):
    response = client.get(BACKEND + "/actuator/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert not any(secret in response.text.lower() for secret in ("password", "secret", "token"))
    health = data(client.get(BACKEND + "/api/health"))
    assert health["status"] == "UP", health["components"]
    assert all(health["components"][name] == "UP" for name in ("database", "redis", "kafka", "aiService"))


def test_stats(client):
    stats = data(client.get(BACKEND + "/api/stats"))
    assert "totalThreats" in stats and "totalScans" in stats


def test_live_threats(client):
    assert isinstance(data(client.get(BACKEND + "/api/threats/live"))["content"], list)


def test_heatmap(client):
    assert isinstance(data(client.get(BACKEND + "/api/threats/heatmap")), list)


def test_trends(client):
    data(client.get(BACKEND + "/api/threats/trends", params={"days": 7}))


def test_backend_scan(client):
    result = data(client.post(BACKEND + "/api/scan", json={"inputText": "Your KYC expired share OTP now"}))
    assert 0 <= result["riskScore"] <= 100
    assert isinstance(result["isDangerous"], bool)
    assert result["explanation"]


def test_admin_authentication(client):
    password = os.environ.get("ADMIN_PASS")
    assert password, "PROD_ADMIN_PASSWORD is required"
    result = data(client.post(BACKEND + "/api/auth/login", json={"username": "admin", "password": password}))
    assert result["token"]
    headers = {"Authorization": "Bearer " + result["token"]}
    data(client.get(BACKEND + "/api/admin/dashboard", headers=headers))
    invalid = client.post(BACKEND + "/api/auth/login", json={"username": "admin", "password": "smoke-invalid-password"})
    assert invalid.status_code == 401
    assert client.get(BACKEND + "/api/admin/dashboard").status_code in (401, 403)


def test_swagger(client):
    assert client.get(BACKEND + "/swagger-ui.html").status_code == 200


def test_prometheus(client):
    response = client.get(BACKEND + "/actuator/prometheus")
    assert response.status_code == 200
    assert "jvm_memory_used_bytes" in response.text
    assert "http_server_requests_seconds" in response.text


def test_ai_health(client):
    response = client.get(AI + "/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ai_scan(client):
    result = data(client.post(AI + "/scan/", json={"input_text": "Share OTP to verify your UPI account"}))
    assert 0 <= result["risk_score"] <= 100
    assert isinstance(result["is_dangerous"], bool)
    assert result["explanation"]


def test_ai_classify(client):
    result = data(client.post(AI + "/classify/", json={"text": "Your HDFC bank KYC expired update immediately"}))
    assert result["threat_type"]
    assert 1 <= result["severity"] <= 5


def test_websocket_info(client):
    response = client.get(BACKEND + "/ws/info")
    assert response.status_code == 200
    assert response.json()["websocket"] is True


def test_cors(client):
    response = client.options(BACKEND + "/api/threats/live", headers={
        "Origin": FRONTEND,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization",
    })
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == FRONTEND


def test_rate_limit(client):
    # Run last so the runner IP limit does not invalidate the scan test.
    codes = [client.post(BACKEND + "/api/scan", json={"inputText": f"smoke rate limit {i}"}).status_code for i in range(12)]
    assert set(codes) <= {200, 429}, codes
    assert 429 in codes, "Rate limiter did not reject excess requests"
