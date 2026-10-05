from pydantic import BaseModel, model_validator
from enum import Enum
from typing import List, Optional, Generic, TypeVar
from datetime import datetime, timezone


class ThreatType(str, Enum):
    PHISHING = "PHISHING"
    UPI_FRAUD = "UPI_FRAUD"
    KYC_SCAM = "KYC_SCAM"
    OTP_THEFT = "OTP_THEFT"
    SIM_SWAP = "SIM_SWAP"
    RANSOMWARE = "RANSOMWARE"
    VISHING = "VISHING"
    OTHER = "OTHER"


class ClassifyResponse(BaseModel):
    threat_type: ThreatType
    severity: int
    confidence: float
    detected_language: str
    geo_tags: List[str]
    citizen_explanation: str
    classifier_used: str
    processing_time_ms: float


class ScanResponse(BaseModel):
    risk_score: int
    threat_type: ThreatType
    explanation: str
    is_dangerous: bool
    indicators: List[str]
    classifier_used: str
    processing_time_ms: float


class SignalResultDTO(BaseModel):
    name: str
    detected: bool
    score: float
    detail: str


class ImageScanResponse(BaseModel):
    verdict: str
    confidence: float
    risk_score: int
    is_dangerous: bool
    signals: List[SignalResultDTO]
    ocr_text: Optional[str] = None
    scam_text_analysis: Optional[dict] = None
    explanation: str
    processing_time_ms: float


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: str = ""

    @model_validator(mode="after")
    def set_timestamp(self) -> "ApiResponse":
        if not self.timestamp:
            self.timestamp = (
                datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            )
        return self

    @classmethod
    def success_response(cls, data: T):
        return cls(success=True, data=data)
