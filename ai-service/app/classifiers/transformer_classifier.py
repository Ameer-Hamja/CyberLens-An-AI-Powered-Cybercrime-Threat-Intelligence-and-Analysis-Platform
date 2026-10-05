import torch
import structlog
from dataclasses import dataclass
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.config import Settings
from app.models.response_models import ThreatType

logger = structlog.get_logger()

@dataclass
class TransformerResult:
    threat_type: ThreatType
    confidence: float

class TransformerClassifier:
    LABEL_MAP = {
        0: ThreatType.PHISHING,
        1: ThreatType.UPI_FRAUD,
        2: ThreatType.KYC_SCAM,
        3: ThreatType.OTP_THEFT,
        4: ThreatType.SIM_SWAP,
        5: ThreatType.RANSOMWARE,
        6: ThreatType.VISHING,
        7: ThreatType.OTHER
    }

    def __init__(self, settings: Settings):
        self.settings = settings
        self.model = None
        self.tokenizer = None
        self.loaded = False

    def load(self) -> None:
        model_name = self.settings.model_name
        logger.info(f"Loading transformer model: {model_name}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=self.settings.model_cache_dir)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=8,
                cache_dir=self.settings.model_cache_dir,
                ignore_mismatched_sizes=True
            )
            self.model.eval()
            if self.settings.device == "cuda" and torch.cuda.is_available():
                self.model.to("cuda")
            self.loaded = True
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error("Failed to load transformer model", error=str(e))
            self.loaded = False

    def classify(self, text: str) -> TransformerResult | None:
        if not self.loaded:
            return None
            
        try:
            device = "cuda" if self.settings.device == "cuda" and torch.cuda.is_available() else "cpu"
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True).to(device)
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0]
            top_idx = torch.argmax(probs).item()
            confidence = probs[top_idx].item()
            threat_type = self.LABEL_MAP.get(top_idx, ThreatType.OTHER)
            
            return TransformerResult(threat_type, confidence)
        except Exception as e:
            logger.error("Transformer classification error", error=str(e))
            return None
