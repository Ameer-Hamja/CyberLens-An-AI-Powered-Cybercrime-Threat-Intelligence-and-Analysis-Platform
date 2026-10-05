from enum import Enum


class ImageVerdict(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    MORPHED = "MORPHED"
    SCAM_SCREENSHOT = "SCAM_SCREENSHOT"
    FAKE_DOCUMENT = "FAKE_DOCUMENT"
    SUSPICIOUS = "SUSPICIOUS"
    LIKELY_LEGITIMATE = "LIKELY_LEGITIMATE"


class ImageExplanationBuilder:
    VERDICT_EXPLANATIONS = {
        ImageVerdict.AI_GENERATED: {
            "headline": "This image appears to be AI-generated.",
            "detail": "Available model or metadata signals suggest this image was created by an AI tool such as Midjourney, DALL-E, or Stable Diffusion — not captured by a real camera.",
            "advice": "Do not trust faces, documents, or scenes in this image as real. AI-generated images are frequently used in romance scams, fake profiles, and disinformation.",
        },
        ImageVerdict.MORPHED: {
            "headline": "This image shows signs of manipulation or morphing.",
            "detail": "Error level analysis detected regions of the image that were saved at different compression levels ; compression and editing can also produce these signals.",
            "advice": "Do not rely on this image as evidence of identity or events. Face swaps and document alterations are common in blackmail, fraud, and impersonation scams.",
        },
        ImageVerdict.SCAM_SCREENSHOT: {
            "headline": "This appears to be a scam message screenshot.",
            "detail": "The image contains screenshot patterns and text that matches known cybercrime templates — fake bank alerts, lottery wins, KYC warnings, or prize notifications.",
            "advice": "Do not act on the instructions in this message. Report it to cybercrime.gov.in and block the sender.",
        },
        ImageVerdict.FAKE_DOCUMENT: {
            "headline": "This may be a tampered or fake document.",
            "detail": "The image appears to be an identity or government document (Aadhaar, PAN, certificate) with signs of digital alteration. Pixel-level inconsistencies were found in key regions.",
            "advice": "Do not accept this document as valid proof of identity. Verify directly with the issuing authority.",
        },
        ImageVerdict.SUSPICIOUS: {
            "headline": "This image has suspicious characteristics.",
            "detail": "Multiple low-level signals suggest this image may not be entirely authentic, but confidence is not high enough for a definitive verdict.",
            "advice": "Exercise caution. Treat any claims made using this image with skepticism and seek independent verification.",
        },
        ImageVerdict.LIKELY_LEGITIMATE: {
            "headline": "No strong signals found.",
            "detail": "The available heuristic checks found no strong signals. They cannot establish authenticity or rule out manipulation.",
            "advice": "While no manipulation was detected, always verify important claims through official channels.",
        },
    }

    def build(
        self,
        verdict: ImageVerdict,
        signals: list,
        risk_score: int,
        ocr_text: str | None,
    ) -> str:
        template = self.VERDICT_EXPLANATIONS[verdict]
        parts = [template["headline"], template["detail"]]

        detected_signals = [s for s in signals if s.detected]
        if detected_signals:
            signal_list = ", ".join(s.name for s in detected_signals[:3])
            parts.append(f"Signals triggered: {signal_list}.")

        if ocr_text and len(ocr_text.strip()) > 10:
            parts.append(
                f'Text detected in image: "{ocr_text[:120].strip()}..."'
                if len(ocr_text) > 120
                else f'Text detected in image: "{ocr_text.strip()}"'
            )

        parts.append(template["advice"])
        return " ".join(parts)
