import time
import asyncio
import re
import langdetect
import structlog
from app.config import Settings
from app.models.request_models import ClassifyRequest, ScanRequest
from app.models.response_models import ClassifyResponse, ScanResponse, ThreatType
from app.classifiers.transformer_classifier import TransformerClassifier
from app.classifiers.rule_based_classifier import RuleBasedClassifier
from app.utils.text_cleaner import TextCleaner
from app.utils.geo_extractor import GeoExtractor
from app.utils.explanation_builder import ExplanationBuilder

from app.classifiers.image_classifier import ImageClassifier

logger = structlog.get_logger()


class ClassifierPipeline:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.transformer = TransformerClassifier(settings)
        self.rule_based = RuleBasedClassifier()
        self.text_cleaner = TextCleaner()
        self.geo_extractor = GeoExtractor()
        self.explanation_builder = ExplanationBuilder()
        self.image_classifier = ImageClassifier(settings)

    async def startup(self) -> None:
        loop = asyncio.get_event_loop()
        if self.settings.enable_transformer:
            await loop.run_in_executor(None, self.transformer.load)
        if self.settings.enable_image_models:
            await loop.run_in_executor(None, self.image_classifier.load)
        logger.info("Image classifier ready (loaded=%s)", self.image_classifier.loaded)

    def detect_language(self, text: str) -> str:
        try:
            return langdetect.detect(text)
        except Exception:
            return "unknown"

    def compute_severity(
        self, threat_type: ThreatType, confidence: float, geo_tags: list[str]
    ) -> int:
        base = {
            ThreatType.PHISHING: 3,
            ThreatType.UPI_FRAUD: 4,
            ThreatType.KYC_SCAM: 3,
            ThreatType.OTP_THEFT: 4,
            ThreatType.SIM_SWAP: 4,
            ThreatType.RANSOMWARE: 5,
            ThreatType.VISHING: 3,
            ThreatType.OTHER: 1,
        }.get(threat_type, 1)

        return base  # Category impact and confidence are separate concepts.

    def compute_risk_score(
        self, rule_result, indicators: list[str], is_url: bool, is_upi: bool
    ) -> int:
        base = int(rule_result.confidence * 70)
        indicator_boost = min(len(indicators) * 5, 20)
        type_boost = {
            ThreatType.PHISHING: 10,
            ThreatType.UPI_FRAUD: 15,
            ThreatType.OTP_THEFT: 15,
            ThreatType.KYC_SCAM: 10,
            ThreatType.SIM_SWAP: 12,
            ThreatType.RANSOMWARE: 20,
            ThreatType.VISHING: 8,
            ThreatType.OTHER: 0,
        }.get(rule_result.threat_type, 0)
        url_boost = 5 if is_url else 0
        return min(100, base + indicator_boost + type_boost + url_boost)

    def classify(self, request: ClassifyRequest) -> ClassifyResponse:
        start_time = time.perf_counter()

        clean_text = self.text_cleaner.clean(
            request.text, self.settings.max_text_length
        )
        geo_tags = self.geo_extractor.extract(request.text)
        detected_language = self.detect_language(request.text)

        transformer_result = self.transformer.classify(clean_text)

        if (
            transformer_result is not None
            and transformer_result.confidence >= self.settings.confidence_threshold
        ):
            threat_type = transformer_result.threat_type
            confidence = transformer_result.confidence
            classifier_used = "transformer"
        elif transformer_result is not None:
            rule_result = self.rule_based.classify(clean_text)
            if rule_result.threat_type == transformer_result.threat_type:
                threat_type = transformer_result.threat_type
                confidence = (
                    transformer_result.confidence + rule_result.confidence
                ) / 2
                classifier_used = "hybrid"
            else:
                threat_type = rule_result.threat_type
                confidence = rule_result.confidence
                classifier_used = "rule_based"
        else:
            rule_result = self.rule_based.classify(clean_text)
            threat_type = rule_result.threat_type
            confidence = rule_result.confidence
            classifier_used = "rule_based"

        severity = self.compute_severity(threat_type, confidence, geo_tags)
        explanation = self.explanation_builder.build(
            threat_type, geo_tags, severity, confidence
        )
        processing_time = (time.perf_counter() - start_time) * 1000

        return ClassifyResponse(
            threat_type=threat_type,
            severity=severity,
            confidence=confidence,
            detected_language=detected_language,
            geo_tags=geo_tags,
            citizen_explanation=explanation,
            classifier_used=classifier_used,
            processing_time_ms=processing_time,
        )

    def scan(self, request: ScanRequest) -> ScanResponse:
        start_time = time.perf_counter()

        is_url = self.text_cleaner.is_url(request.input_text)
        is_upi = self.text_cleaner.is_upi_id(request.input_text)

        augmented_text = request.input_text

        rule_result = self.rule_based.classify(augmented_text)
        indicators = self.rule_based.extract_indicators(augmented_text)

        if is_url:
            if re.search(
                r"(sb1|hdf[ck]|1cici|ax1s).{0,20}\.(com|in|net|org)",
                request.input_text.lower(),
            ):
                indicators.append("Possible typosquatting of a major bank domain")

            from urllib.parse import urlsplit

            hostname = (
                urlsplit(
                    request.input_text
                    if "://" in request.input_text
                    else "https://" + request.input_text
                ).hostname
                or ""
            )
            if re.search(r"\.(xyz|tk|ml|ga|cf|gq)$", hostname.lower()):
                indicators.append("Uses a suspicious domain extension")

            if re.search(r"https?://\d+\.\d+\.\d+\.\d+", request.input_text):
                indicators.append(
                    "URL uses raw IP address (unusual for legitimate sites)"
                )

        risk_score = self.compute_risk_score(rule_result, indicators, is_url, is_upi)
        if re.search(
            r"(sb1|hdf[ck]|1cici|ax1s).{0,20}\.(com|in|net|org)",
            request.input_text.lower(),
        ):
            risk_score = min(100, risk_score + 10)

        explanation = self.explanation_builder.build_scan_explanation(
            rule_result.threat_type, risk_score, indicators
        )
        processing_time = (time.perf_counter() - start_time) * 1000

        return ScanResponse(
            risk_score=risk_score,
            threat_type=rule_result.threat_type,
            explanation=explanation,
            is_dangerous=risk_score >= 60,
            indicators=indicators,
            classifier_used="rule_based",
            processing_time_ms=processing_time,
        )
