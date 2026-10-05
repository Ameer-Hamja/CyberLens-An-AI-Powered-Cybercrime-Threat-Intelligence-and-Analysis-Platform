import pytest
from app.classifiers.rule_based_classifier import RuleBasedClassifier
from app.models.response_models import ThreatType

@pytest.fixture
def classifier():
    return RuleBasedClassifier()

def test_classifies_upi_fraud(classifier):
    text = "Send money to UPI ID scammer@okaxis immediately"
    result = classifier.classify(text)
    assert result.threat_type == ThreatType.UPI_FRAUD
    assert result.confidence > 0.5

def test_classifies_otp_theft(classifier):
    text = "Share your OTP with our bank agent to verify account"
    result = classifier.classify(text)
    assert result.threat_type == ThreatType.OTP_THEFT
    assert result.confidence > 0.5

def test_classifies_kyc_scam(classifier):
    text = "Your KYC verification is pending. Account will be suspended in 24 hours"
    result = classifier.classify(text)
    assert result.threat_type == ThreatType.KYC_SCAM
    assert result.confidence > 0.5

def test_classifies_phishing(classifier):
    text = "Click this link to verify your identity and avoid account suspension"
    result = classifier.classify(text)
    assert result.threat_type == ThreatType.PHISHING
    assert result.confidence > 0.5

def test_returns_other_for_benign(classifier):
    text = "Today is a sunny day and the weather is nice"
    result = classifier.classify(text)
    assert result.threat_type == ThreatType.OTHER
    assert result.confidence < 0.5

def test_extract_indicators_returns_list(classifier):
    text = "Send money to UPI ID scammer@okaxis immediately"
    indicators = classifier.extract_indicators(text)
    assert isinstance(indicators, list)
    assert len(indicators) > 0
