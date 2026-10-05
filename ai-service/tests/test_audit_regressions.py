from app.classifiers.classifier_pipeline import ClassifierPipeline
from app.classifiers.image_classifier import ImageClassifier, SignalResult
from app.classifiers.transformer_classifier import TransformerClassifier
from app.config import Settings
from app.models.request_models import ScanRequest
from app.models.response_models import ThreatType
from app.utils.geo_extractor import GeoExtractor
from app.utils.text_cleaner import TextCleaner
from app.utils.image_explanation_builder import ImageVerdict


def test_unicode_cleaner_preserves_indic_text():
    assert TextCleaner().clean('आपका बैंक खाता') == 'आपका बैंक खाता'


def test_unknown_geography_is_not_india():
    extractor = GeoExtractor()
    assert extractor.extract('Please update your bank account') == []
    assert extractor.extract('up to 10 minutes in time') == []
    assert 'Maharashtra' in extractor.extract('Mumbai police advisory')


def test_benign_upi_does_not_inject_suspicious_keyword():
    result = ClassifierPipeline(Settings()).scan(ScanRequest(input_text='person@okaxis'))
    assert result.threat_type == ThreatType.OTHER
    assert not result.is_dangerous


def test_safety_advice_does_not_classify_as_otp_theft():
    result = ClassifierPipeline(Settings()).scan(ScanRequest(input_text='Do not share your OTP. It is valid for five minutes.'))
    assert result.threat_type != ThreatType.OTP_THEFT


def test_text_patterns_after_old_truncation_limit_are_kept():
    text = 'ordinary text ' * 100 + 'share your otp now'
    assert 'share your otp' in TextCleaner().clean(text)


def test_screenshot_or_document_shape_is_not_evidence_of_fraud():
    classifier = ImageClassifier(Settings())
    for name in ('Screenshot Pattern Detection', 'Document Pattern Detection'):
        signals = [SignalResult(name=name, detected=True, score=0.95, detail='Shape only')]
        verdict, confidence, risk = classifier._compute_verdict(signals, None)
        assert verdict == ImageVerdict.LIKELY_LEGITIMATE
        assert confidence == 0
        assert risk < 30


def test_untrained_default_checkpoint_is_not_loaded():
    classifier = TransformerClassifier(Settings())
    classifier.load()
    assert not classifier.loaded
