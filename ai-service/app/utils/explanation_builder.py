from app.models.response_models import ThreatType


class ExplanationBuilder:
    def __init__(self):
        self.templates = {
            ThreatType.PHISHING: [
                "This appears to be a phishing attempt targeting internet users in {geo}. Fraudsters are mimicking legitimate websites to steal your login credentials. Do not click any links.",
                "A phishing campaign has been detected affecting users in {geo}. The content tries to trick you into revealing passwords or banking details. Delete this message immediately.",
            ],
            ThreatType.UPI_FRAUD: [
                "This looks like a UPI payment fraud targeting users in {geo}. Scammers send fake payment requests or QR codes to steal money. Never share your UPI PIN with anyone.",
                "A potential UPI scam is circulating in {geo}. You are being asked to authorize a transaction under false pretenses. Decline the request.",
            ],
            ThreatType.KYC_SCAM: [
                "This is a KYC renewal scam active in {geo}. Fraudsters impersonate banks or telecom companies claiming your account will be suspended. Real companies never ask for KYC details over SMS or WhatsApp.",
                "Suspicious KYC update request detected in {geo}. Do not share PAN, Aadhaar, or bank details. Contact your service provider directly through official channels.",
            ],
            ThreatType.OTP_THEFT: [
                "This message attempts to steal an OTP from users in {geo}. Never share your OTP with anyone, even if they claim to be from a bank or customer support.",
                "OTP fraud detected targeting {geo}. The sender is trying to bypass two-factor authentication to access your accounts. Do not share the code.",
            ],
            ThreatType.SIM_SWAP: [
                "This indicates a potential SIM swap or porting scam in {geo}. Fraudsters are trying to take control of your phone number. Contact your mobile operator immediately if you lose network.",
                "SIM card upgrade or porting scam detected in {geo}. Do not follow the instructions to send SMS for SIM swapping.",
            ],
            ThreatType.RANSOMWARE: [
                "This is a ransomware threat reported in {geo}. Malicious actors are attempting to encrypt your files and demand payment. Ensure your systems are backed up and do not pay the ransom.",
                "Ransomware alert for {geo}. This involves malware that locks your device or data. Do not download unexpected attachments or click suspicious links.",
            ],
            ThreatType.VISHING: [
                "This appears to be a vishing (voice phishing) scam in {geo}. Scammers use fake phone calls to extract sensitive information or money. Hang up and do not trust caller ID.",
                "Fake phone call scam detected in {geo}. The caller may impersonate police, bank officials, or tech support to intimidate you. Do not provide any information.",
            ],
            ThreatType.OTHER: [
                "A potential cyber threat has been detected in {geo}. Please exercise caution and verify the source before taking any action.",
                "Suspicious activity observed targeting {geo}. Do not share personal information or click unknown links.",
            ],
        }

    def build(
        self,
        threat_type: ThreatType,
        geo_tags: list[str],
        severity: int,
        confidence: float,
    ) -> str:
        category = threat_type.value.replace("_", " ").lower()
        assessment = (
            "No supported threat pattern identified"
            if threat_type == ThreatType.OTHER
            else f"Content matches {category} patterns"
        )
        location = (
            f" Places mentioned: {', '.join(geo_tags)}. Mentions do not establish an incident location."
            if geo_tags
            else " Incident location is unknown."
        )
        return (
            assessment + "." + location + " Verify the report and source independently."
        )

    def build_scan_explanation(
        self, threat_type: ThreatType, risk_score: int, indicators: list[str]
    ) -> str:
        if risk_score < 40:
            return "No strong risk patterns were found by these rules. This does not verify that the content is safe; verify important requests independently."

        type_str = threat_type.value.replace("_", " ").lower()
        if threat_type == ThreatType.OTHER:
            first_sentence = "We detected suspicious elements in your input."
        else:
            first_sentence = f"We detected strong signs of {type_str} in this input."

        if risk_score >= 80:
            second_sentence = "This is highly dangerous. Do not interact, click links, or share any personal information."
        elif risk_score >= 60:
            second_sentence = (
                "This is suspicious. Exercise extreme caution and verify the source."
            )
        else:
            second_sentence = "This contains some risky patterns. Proceed with caution."

        return f"{first_sentence} {second_sentence}"
