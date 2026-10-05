import pytest
import io
from PIL import Image
from app.classifiers.image_classifier import ImageClassifier, SignalResult
from app.utils.image_explanation_builder import ImageVerdict
from app.config import Settings
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def classifier():
    settings = Settings()
    return ImageClassifier(settings)

@pytest.fixture
def plain_white_image():
    img = Image.new("RGB", (400, 800), color=(255, 255, 255))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()

@pytest.fixture
def high_ela_image():
    # Create image, paste a region from a different image into it
    img = Image.new("RGB", (800, 800), color=(100, 100, 100))
    paste_img = Image.new("RGB", (200, 200), color=(255, 0, 0))
    # Apply some noise to pasted part to simulate different source
    img.paste(paste_img, (100, 100))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=50) # Save low quality
    return buffer.getvalue()

@pytest.fixture
def screenshot_image():
    img = Image.new("RGB", (400, 800), color=(255, 255, 255))
    # Add status bar
    status = Image.new("RGB", (400, 40), color=(0, 0, 0))
    img.paste(status, (0, 0))
    return img

def test_load_image_valid(classifier, plain_white_image):
    assert classifier._load_image(plain_white_image) is not None

def test_load_image_invalid(classifier):
    assert classifier._load_image(b"not an image") is None

def test_ela_runs_without_crash(classifier, plain_white_image):
    image = Image.open(io.BytesIO(plain_white_image))
    result = classifier._detect_ela(image, plain_white_image)
    assert isinstance(result, SignalResult)
    assert 0.0 <= result.score <= 1.0

def test_screenshot_detection_mobile_ratio(classifier, screenshot_image):
    result = classifier._detect_screenshot_patterns(screenshot_image)
    assert isinstance(result, SignalResult)

def test_metadata_detection_no_exif(classifier):
    png_image = Image.new("RGB", (100, 100))
    buffer = io.BytesIO()
    png_image.save(buffer, format="PNG")
    result = classifier._detect_metadata_anomalies(buffer.getvalue(), "test.jpg")
    assert result.detected is False
    assert result.score == pytest.approx(0.2)
    assert "No EXIF metadata" in result.detail

def test_metadata_detection_editing_software(classifier):
    image = Image.new("RGB", (100, 100))
    exif = Image.Exif()
    exif[305] = "Adobe Photoshop"
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", exif=exif)
    result = classifier._detect_metadata_anomalies(buffer.getvalue(), "test.jpg")
    assert result.detected is True
    assert result.score == pytest.approx(0.4)

def test_verdict_legitimate_for_clean_image(classifier):
    signals = [
        SignalResult(name=n, detected=False, score=0.0, detail="")
        for n in ["Error Level Analysis (ELA)", "Metadata Analysis", 
                  "Screenshot Pattern Detection", "Document Pattern Detection",
                  "AI Generation Detection (Neural)", "OCR Text Analysis"]
    ]
    verdict, conf, risk = classifier._compute_verdict(signals, None)
    assert verdict == ImageVerdict.LIKELY_LEGITIMATE
    assert risk < 30

def test_full_analyze_runs(classifier, plain_white_image):
    result = classifier.analyze(plain_white_image, "test.jpg")
    assert result.verdict is not None
    assert 0 <= result.risk_score <= 100
    assert result.processing_time_ms > 0

client = TestClient(app)

def test_scan_endpoint_rejects_non_image():
    response = client.post("/scan/image", files={"file": ("test.txt", b"hello world", "text/plain")})
    assert response.status_code == 415

def test_scan_endpoint_rejects_oversized():
    # 11MB fake bytes
    big_bytes = b"0" * (11 * 1024 * 1024)
    response = client.post("/scan/image", files={"file": ("test.jpg", big_bytes, "image/jpeg")})
    assert response.status_code == 413
