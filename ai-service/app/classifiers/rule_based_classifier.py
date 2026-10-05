import re
from dataclasses import dataclass
from typing import List
from app.models.response_models import ThreatType


@dataclass
class RuleBasedResult:
    threat_type: ThreatType
    severity: int
    confidence: float
    matched_patterns: List[str]


class RuleBasedClassifier:
    def __init__(self):
        # Tuple: (Pattern, ThreatType, BaseSeverity, Weight, IndicatorText)
        self.RULES = [
            # PHISHING
            (
                re.compile(r"(fake|fraudulent|spoof).{0,20}(website|site|portal|page)"),
                ThreatType.PHISHING,
                4,
                1.0,
                "Mentions a fake or fraudulent website",
            ),
            (
                re.compile(
                    r"(click|visit|open).{0,30}(link|url|website).{0,30}(verify|confirm|update)"
                ),
                ThreatType.PHISHING,
                3,
                0.8,
                "Asks to click a link to verify details",
            ),
            (
                re.compile(
                    r"(your\s+account|login).{0,20}(suspended|blocked|compromised|hacked)"
                ),
                ThreatType.PHISHING,
                4,
                0.9,
                "Claims account is suspended or hacked",
            ),
            (
                re.compile(
                    r"(verify|confirm|validate).{0,20}(identity|account|details|information)"
                ),
                ThreatType.PHISHING,
                3,
                0.7,
                "Requests identity verification",
            ),
            (
                re.compile(
                    r"(password|credentials).{0,20}(expired|reset|change\s+immediately)"
                ),
                ThreatType.PHISHING,
                4,
                0.9,
                "Urgent password reset request",
            ),
            # UPI_FRAUD
            (
                re.compile(r"upi\s*(id|handle|payment|fraud|scam)"),
                ThreatType.UPI_FRAUD,
                5,
                1.0,
                "Contains UPI payment fraud keywords",
            ),
            (
                re.compile(
                    r"(send|transfer|pay).{0,20}(money|amount|rs\.?|inr|rupees)"
                ),
                ThreatType.UPI_FRAUD,
                4,
                0.8,
                "Requests a money transfer",
            ),
            (
                re.compile(
                    r"(collect|receive).{0,20}(payment|money).{0,20}(qr|code|link)"
                ),
                ThreatType.UPI_FRAUD,
                5,
                1.0,
                "Asks to scan QR or click link to receive money",
            ),
            (
                re.compile(r"upi\s+pin\s+(share|enter|provide|give)"),
                ThreatType.UPI_FRAUD,
                5,
                1.0,
                "Asks for UPI PIN",
            ),
            (
                re.compile(
                    r"(google\s*pay|phonepe|paytm|bhim).{0,20}(fraud|scam|fake)"
                ),
                ThreatType.UPI_FRAUD,
                4,
                0.9,
                "Mentions a major payment app scam",
            ),
            (
                re.compile(
                    r"₹\s*\d+.{0,30}(transfer|send|pay).{0,30}(immediately|urgent|now)"
                ),
                ThreatType.UPI_FRAUD,
                4,
                0.8,
                "Urgent request for money",
            ),
            # KYC_SCAM
            (
                re.compile(r"kyc\s*(update|verification|expired|pending|complete)"),
                ThreatType.KYC_SCAM,
                4,
                1.0,
                "Mentions KYC update or expiration",
            ),
            (
                re.compile(
                    r"(account|sim|service).{0,20}(suspend|block|deactivat).{0,20}kyc"
                ),
                ThreatType.KYC_SCAM,
                4,
                1.0,
                "Threatens suspension for pending KYC",
            ),
            (
                re.compile(r"(submit|provide|upload).{0,20}(aadhar|pan|passport|kyc)"),
                ThreatType.KYC_SCAM,
                3,
                0.8,
                "Asks to upload identity documents",
            ),
            (
                re.compile(r"kyc.{0,30}(24\s*hours?|48\s*hours?|immediately|urgent)"),
                ThreatType.KYC_SCAM,
                4,
                0.9,
                "Urgent KYC deadline",
            ),
            (
                re.compile(r"(irdai|sebi|rbi|trai).{0,20}(kyc|compliance|mandatory)"),
                ThreatType.KYC_SCAM,
                3,
                0.7,
                "Fake regulatory KYC mandate",
            ),
            # OTP_THEFT
            (
                re.compile(
                    r"(?<!not )(?<!never )(share|provide|give|send|tell).{0,20}otp"
                ),
                ThreatType.OTP_THEFT,
                5,
                1.0,
                "Asks to share an OTP",
            ),
            (
                re.compile(r"one\s*time\s*(password|pin).{0,30}(share|enter|provide)"),
                ThreatType.OTP_THEFT,
                5,
                1.0,
                "Asks to enter a One Time Password",
            ),
            (
                re.compile(
                    r"(bank|sbi|hdfc|icici|axis).{0,20}otp.{0,20}(verify|confirm)"
                ),
                ThreatType.OTP_THEFT,
                4,
                0.9,
                "Fake bank OTP verification",
            ),
            # SIM_SWAP
            (
                re.compile(r"sim\s*(swap|port|transfer|clone)"),
                ThreatType.SIM_SWAP,
                5,
                1.0,
                "Mentions SIM swapping or cloning",
            ),
            (
                re.compile(
                    r"(port|transfer).{0,20}(number|mobile|sim).{0,20}(operator|network)"
                ),
                ThreatType.SIM_SWAP,
                4,
                0.8,
                "Mentions mobile number porting",
            ),
            (
                re.compile(r"(mnp|mobile\s+number\s+portability).{0,20}(fraud|scam)"),
                ThreatType.SIM_SWAP,
                4,
                0.9,
                "Mentions MNP fraud",
            ),
            # RANSOMWARE
            (
                re.compile(r"(files?|data|system).{0,20}(encrypt|locked|ransom)"),
                ThreatType.RANSOMWARE,
                5,
                1.0,
                "Claims files are encrypted or locked",
            ),
            (
                re.compile(r"(pay|bitcoin|crypto).{0,30}(decrypt|restore|unlock)"),
                ThreatType.RANSOMWARE,
                5,
                1.0,
                "Demands crypto to decrypt files",
            ),
            (
                re.compile(r"ransomware|cryptolocker|wannacry"),
                ThreatType.RANSOMWARE,
                5,
                1.0,
                "Mentions known ransomware names",
            ),
            (
                re.compile(
                    r"(pay|transfer).{0,20}(bitcoin|btc|ethereum|eth|crypto).{0,20}(restore|unlock)"
                ),
                ThreatType.RANSOMWARE,
                5,
                0.9,
                "Crypto payment demand for unlocking",
            ),
            # VISHING
            (
                re.compile(
                    r"(received?|got).{0,20}(call|phone|rang).{0,20}(bank|insurance|police)"
                ),
                ThreatType.VISHING,
                3,
                0.8,
                "Mentions receiving a suspicious call",
            ),
            (
                re.compile(
                    r"(fake|fraud).{0,20}(call|caller|phone).{0,20}(cbi|police|income\s*tax)"
                ),
                ThreatType.VISHING,
                4,
                0.9,
                "Fake call from an authority figure",
            ),
            (
                re.compile(
                    r"(press|dial).{0,20}\d.{0,20}(talk|speak|connect).{0,20}(agent|officer)"
                ),
                ThreatType.VISHING,
                3,
                0.7,
                "Instructs to press a number to speak to an agent",
            ),
            (
                re.compile(
                    r"(income\s*tax|it\s*department).{0,20}(arrest|case|legal\s*action)"
                ),
                ThreatType.VISHING,
                4,
                0.9,
                "Threatens legal action over phone",
            ),
        ]

    def classify(self, text: str) -> RuleBasedResult:
        text_lower = text.lower()
        matched = []

        for pattern, t_type, severity, weight, indicator in self.RULES:
            if pattern.search(text_lower):
                matched.append((t_type, severity, weight, indicator))

        if not matched:
            return RuleBasedResult(ThreatType.OTHER, 1, 0.0, [])

        scores = {}
        for t_type, severity, weight, ind in matched:
            scores[t_type] = scores.get(t_type, 0.0) + weight

        sorted_types = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_type = sorted_types[0][0]
        top_score = sorted_types[0][1]
        second_score = sorted_types[1][1] if len(sorted_types) > 1 else 0.0

        confidence = min(top_score / (top_score + second_score + 0.01), 0.95)

        top_matches = [m for m in matched if m[0] == top_type]
        avg_severity = sum(m[1] * m[2] for m in top_matches) / sum(
            m[2] for m in top_matches
        )
        severity = max(1, min(5, round(avg_severity)))

        patterns = [m[3] for m in top_matches]

        return RuleBasedResult(top_type, severity, confidence, patterns)

    def extract_indicators(self, text: str) -> List[str]:
        text_lower = text.lower()
        indicators = []

        for pattern, t_type, severity, weight, indicator in self.RULES:
            if pattern.search(text_lower):
                if indicator not in indicators:
                    indicators.append(indicator)
                    if len(indicators) >= 5:
                        break

        return indicators
