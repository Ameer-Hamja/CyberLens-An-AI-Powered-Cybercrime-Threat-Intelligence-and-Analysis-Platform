import io
import time
from enum import Enum
from dataclasses import dataclass
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np
import cv2
import pytesseract
from transformers import pipeline

import structlog

from app.config import Settings
from app.classifiers.rule_based_classifier import RuleBasedClassifier
from app.utils.text_cleaner import TextCleaner
from app.utils.image_explanation_builder import ImageExplanationBuilder, ImageVerdict

log = structlog.get_logger()

@dataclass
class SignalResult:
    name: str
    detected: bool
    score: float
    detail: str

@dataclass
class ImageAnalysisResult:
    verdict: ImageVerdict
    confidence: float
    risk_score: int
    is_dangerous: bool
    signals: list[SignalResult]
    ocr_text: str | None
    scam_text_analysis: dict | None
    explanation: str
    processing_time_ms: float

class ImageClassifier:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.ai_detector = None
        self.doc_classifier = None
        self.loaded = False
        self.rule_based = RuleBasedClassifier()
        self.text_cleaner = TextCleaner()
        self.explanation_builder = ImageExplanationBuilder()

    def load(self) -> None:
        try:
            self.ai_detector = pipeline(
                "image-classification",
                model="haywoodsloan/ai-image-detector-deploy",
                device=-1
            )
            self.doc_classifier = pipeline(
                "image-classification", 
                model="microsoft/dit-base-finetuned-rvlcdip",
                device=-1
            )
            self.loaded = True
        except Exception as e:
            log.warning("Image models failed to load, using signal-based only", error=str(e))
            self.loaded = False

    def analyze(self, image_bytes: bytes, filename: str) -> ImageAnalysisResult:
        start = time.perf_counter()
        signals: list[SignalResult] = []
        
        image = self._load_image(image_bytes)
        if image is None:
            raise ValueError("Invalid or corrupted image file")
            
        signals.append(self._detect_ela(image, image_bytes))
        signals.append(self._detect_metadata_anomalies(image_bytes, filename))
        signals.append(self._detect_screenshot_patterns(image))
        signals.append(self._detect_document_patterns(image))
        
        if self.loaded:
            signals.append(self._detect_ai_generation(image))
            
        ocr_text = self._extract_text(image)
        scam_analysis = None
        if ocr_text and len(ocr_text.strip()) > 20:
            scam_analysis = self._analyze_ocr_text(ocr_text)
            signals.append(self._build_ocr_signal(scam_analysis))
            
        verdict, confidence, risk_score = self._compute_verdict(signals, scam_analysis)
        
        explanation = self.explanation_builder.build(
            verdict, signals, risk_score, ocr_text)
            
        processing_time = (time.perf_counter() - start) * 1000
        
        return ImageAnalysisResult(
            verdict=verdict,
            confidence=confidence,
            risk_score=risk_score,
            is_dangerous=risk_score >= 60,
            signals=signals,
            ocr_text=ocr_text if ocr_text else None,
            scam_text_analysis=scam_analysis,
            explanation=explanation,
            processing_time_ms=processing_time
        )

    def _load_image(self, image_bytes: bytes) -> Image.Image | None:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image = image.convert("RGB")
            max_dim = 1024
            if image.width > max_dim or image.height > max_dim:
                image.thumbnail((max_dim, max_dim), Image.LANCZOS)
            return image
        except Exception:
            return None

    def _detect_ela(self, image: Image.Image, original_bytes: bytes) -> SignalResult:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)
        recompressed = Image.open(buffer).convert("RGB")
        
        orig_array = np.array(image, dtype=np.float32)
        recomp_array = np.array(recompressed, dtype=np.float32)
        diff = np.abs(orig_array - recomp_array)
        
        mean_ela = float(np.mean(diff))
        max_ela = float(np.max(diff))
        std_ela = float(np.std(diff))
        
        h, w, c = diff.shape
        block_size = 8
        h_blocks = h // block_size
        w_blocks = w // block_size
        if h_blocks > 0 and w_blocks > 0:
            diff_cropped = diff[:h_blocks*block_size, :w_blocks*block_size, :]
            blocks = diff_cropped.reshape(h_blocks, block_size, w_blocks, block_size, c)
            block_means = blocks.mean(axis=(1, 3, 4))
            regional_variance = float(np.std(block_means))
        else:
            regional_variance = 0.0
            
        score = 0.0
        if mean_ela > 8.0: score += 0.3
        if max_ela > 40.0: score += 0.2
        if regional_variance > 5.0: score += 0.4
        if std_ela > 10.0: score += 0.1
        score = min(score, 1.0)
        
        detected = score > 0.45
        
        detail = (
            f"ELA mean={mean_ela:.1f}, regional_variance={regional_variance:.1f}. "
            + ("High regional inconsistency detected — possible paste/splice."
               if detected else "ELA pattern appears consistent.")
        )
        
        return SignalResult(
            name="Error Level Analysis (ELA)",
            detected=detected,
            score=score,
            detail=detail
        )

    def _detect_metadata_anomalies(self, image_bytes: bytes, filename: str) -> SignalResult:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            exif_data = image._getexif() if hasattr(image, '_getexif') else None
        except:
            exif_data = None
            
        score = 0.0
        details = []
        
        if exif_data is None and filename.lower().endswith(('.jpg','.jpeg')):
            score += 0.2
            details.append("No EXIF metadata — unusual for a camera photo")
            
        software_tag = exif_data.get(305, "") if exif_data else ""
        editing_tools = ["photoshop", "gimp", "lightroom", "canva",
                         "pixlr", "snapseed", "facetune", "retouch"]
        if any(tool in software_tag.lower() for tool in editing_tools):
            score += 0.4
            details.append(f"Edited with: {software_tag}")
            
        ai_tools = ["stable diffusion", "midjourney", "dall-e", 
                    "firefly", "imagen", "runway"]
        if any(tool in software_tag.lower() for tool in ai_tools):
            score += 0.7
            details.append(f"AI tool signature found: {software_tag}")
            
        datetime_original = exif_data.get(36867) if exif_data else None
        datetime_modified = exif_data.get(306) if exif_data else None
        if datetime_original and datetime_modified and datetime_original != datetime_modified:
            score += 0.15
            details.append("Modification timestamp differs from creation time")
            
        score = min(score, 1.0)
        detected = score > 0.35
        detail = "; ".join(details) if details else "No metadata anomalies found"
        
        return SignalResult(
            name="Metadata Analysis",
            detected=detected,
            score=score,
            detail=detail
        )

    def _detect_screenshot_patterns(self, image: Image.Image) -> SignalResult:
        img_array = np.array(image)
        ratio = image.height / max(image.width, 1)
        is_mobile_ratio = 1.5 <= ratio <= 2.5
        
        if img_array.shape[0] >= 120:
            top_band = img_array[:40, :, :]
            bottom_band = img_array[-80:, :, :]
            top_variance = float(np.var(top_band))
            bottom_variance = float(np.var(bottom_band))
            has_ui_bands = top_variance < 500 and bottom_variance < 500
        else:
            has_ui_bands = False
            
        mean_brightness = float(np.mean(img_array))
        is_light_bg = mean_brightness > 200
        
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0)) / max(edges.size, 1)
        high_text_density = edge_density > 0.08
        
        score = 0.0
        if is_mobile_ratio: score += 0.2
        if has_ui_bands: score += 0.35
        if is_light_bg: score += 0.15
        if high_text_density: score += 0.3
        score = min(score, 1.0)
        detected = score > 0.5
        
        detail = (
            f"Mobile ratio={is_mobile_ratio}, UI bands={has_ui_bands}, "
            f"text density={edge_density:.3f}. "
            + ("Screenshot pattern detected." if detected 
               else "Does not appear to be a screenshot.")
        )
        
        return SignalResult(
            name="Screenshot Pattern Detection",
            detected=detected,
            score=score,
            detail=detail
        )

    def _detect_document_patterns(self, image: Image.Image) -> SignalResult:
        ratio = image.width / max(image.height, 1)
        is_landscape_doc = 1.3 <= ratio <= 1.6
        is_portrait_doc = 0.6 <= ratio <= 0.85
        
        img_array = np.array(image.convert("L"))
        h, w = img_array.shape
        if h > 20 and w > 20:
            top = img_array[:10, :].flatten()
            bottom = img_array[-10:, :].flatten()
            left = img_array[:, :10].flatten()
            right = img_array[:, -10:].flatten()
            edge_pixels = np.concatenate([top, bottom, left, right])
            
            center_h_start = int(h * 0.2)
            center_h_end = int(h * 0.8)
            center_w_start = int(w * 0.2)
            center_w_end = int(w * 0.8)
            center_region = img_array[center_h_start:center_h_end, center_w_start:center_w_end]
            
            edge_mean = np.mean(edge_pixels) if edge_pixels.size > 0 else 0
            center_mean = np.mean(center_region) if center_region.size > 0 else 0
            has_border = edge_mean < center_mean - 20
        else:
            has_border = False
            
        hsv_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2HSV)
        h_chan, s_chan, v_chan = cv2.split(hsv_array)
        orange_mask = (h_chan > 5) & (h_chan < 35) & (s_chan > 100) & (v_chan > 150)
        orange_ratio = np.sum(orange_mask) / max(orange_mask.size, 1)
        has_aadhaar_colors = orange_ratio > 0.05
        
        score = 0.0
        if is_landscape_doc or is_portrait_doc: score += 0.25
        if has_border: score += 0.2
        if has_aadhaar_colors: score += 0.3
        score = min(score, 1.0)
        detected = score > 0.35
        
        detail = (
            f"Document aspect={is_landscape_doc or is_portrait_doc}, "
            f"border={has_border}, govt_colors={has_aadhaar_colors}. "
            + ("Document-type image detected — checking for tampering."
               if detected else "Does not appear to be a document image.")
        )
        
        return SignalResult(
            name="Document Pattern Detection",
            detected=detected,
            score=score,
            detail=detail
        )

    def _detect_ai_generation(self, image: Image.Image) -> SignalResult:
        try:
            results = self.ai_detector(image)
            ai_result = next(
                (r for r in results 
                 if "ai" in r["label"].lower() 
                 or "artificial" in r["label"].lower()
                 or "fake" in r["label"].lower()),
                None
            )
            
            if ai_result:
                score = float(ai_result["score"])
                detected = score > 0.65
                detail = f"AI generation probability: {score:.1%}"
            else:
                score = 0.0
                detected = False
                detail = "AI generation model returned no positive signal"
                
            return SignalResult(
                name="AI Generation Detection (Neural)",
                detected=detected,
                score=score,
                detail=detail
            )
        except Exception:
            return SignalResult(
                name="AI Generation Detection (Neural)",
                detected=False, score=0.0,
                detail="Model inference failed — skipped"
            )

    def _extract_text(self, image: Image.Image) -> str:
        try:
            gray = ImageOps.grayscale(image)
            enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
            sharpened = enhanced.filter(ImageFilter.SHARPEN)
            
            custom_config = r'--oem 3 --psm 6 -l eng+hin'
            text = pytesseract.image_to_string(sharpened, config=custom_config)
            return text.strip()
        except pytesseract.TesseractNotFoundError:
            log.warning("Tesseract not installed — OCR skipped")
            return ""
        except Exception as e:
            log.warning("OCR failed", error=str(e))
            return ""

    def _analyze_ocr_text(self, text: str) -> dict:
        clean = self.text_cleaner.clean(text)
        result = self.rule_based.classify(clean)
        indicators = self.rule_based.extract_indicators(clean)
        
        return {
            "threat_type": result.threat_type.value,
            "confidence": result.confidence,
            "indicators": indicators,
            "raw_text_sample": text[:300]
        }

    def _build_ocr_signal(self, scam_analysis: dict) -> SignalResult:
        confidence = scam_analysis["confidence"]
        threat_type = scam_analysis["threat_type"]
        indicators = scam_analysis["indicators"]
        
        detected = confidence > 0.4 and threat_type != "OTHER"
        score = confidence if detected else confidence * 0.3
        
        detail = (
            f"OCR extracted text classified as {threat_type} "
            f"(confidence: {confidence:.1%}). "
            f"Indicators: {', '.join(indicators[:3]) if indicators else 'none'}"
        )
        
        return SignalResult(
            name="OCR Text Analysis",
            detected=detected,
            score=score,
            detail=detail
        )

    def _compute_verdict(
        self,
        signals: list[SignalResult],
        scam_analysis: dict | None
    ) -> tuple[ImageVerdict, float, int]:
        
        signal_map = {s.name: s for s in signals}
        
        ela = signal_map.get("Error Level Analysis (ELA)")
        metadata = signal_map.get("Metadata Analysis")
        screenshot = signal_map.get("Screenshot Pattern Detection")
        document = signal_map.get("Document Pattern Detection")
        ai_neural = signal_map.get("AI Generation Detection (Neural)")
        ocr = signal_map.get("OCR Text Analysis")
        
        ai_score = 0.0
        if ai_neural and ai_neural.detected:
            ai_score += ai_neural.score * 0.7
        if metadata and "AI tool" in metadata.detail:
            ai_score += 0.5
        if ai_score >= 0.55:
            confidence = min(ai_score, 0.97)
            risk_score = int(60 + confidence * 30)
            return (ImageVerdict.AI_GENERATED, confidence, risk_score)
            
        morph_score = 0.0
        if ela: morph_score += ela.score * 0.6
        if metadata and metadata.detected: morph_score += metadata.score * 0.4
        if morph_score >= 0.50:
            confidence = min(morph_score, 0.95)
            risk_score = int(55 + confidence * 35)
            return (ImageVerdict.MORPHED, confidence, risk_score)
            
        if document and document.detected:
            doc_risk = document.score
            if ela and ela.detected: doc_risk += ela.score * 0.5
            if ocr and ocr.detected: doc_risk += ocr.score * 0.4
            if doc_risk >= 0.45:
                confidence = min(doc_risk, 0.92)
                risk_score = int(60 + confidence * 30)
                return (ImageVerdict.FAKE_DOCUMENT, confidence, risk_score)
                
        if screenshot and screenshot.detected:
            scam_score = screenshot.score * 0.5
            if ocr and ocr.detected: scam_score += ocr.score * 0.5
            if scam_analysis and scam_analysis["confidence"] > 0.5:
                scam_score += 0.3
            if scam_score >= 0.40:
                confidence = min(scam_score, 0.93)
                risk_score = int(50 + confidence * 40)
                return (ImageVerdict.SCAM_SCREENSHOT, confidence, risk_score)
                
        total_signal_score = sum(s.score for s in signals if s.detected)
        if total_signal_score >= 0.3:
            confidence = min(total_signal_score / len(signals), 0.7)
            risk_score = int(30 + confidence * 30)
            return (ImageVerdict.SUSPICIOUS, confidence, risk_score)
            
        confidence = 1.0 - (total_signal_score / max(len(signals), 1))
        risk_score = max(5, int(total_signal_score * 30))
        return (ImageVerdict.LIKELY_LEGITIMATE, confidence, risk_score)
