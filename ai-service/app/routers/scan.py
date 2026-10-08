from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from app.models.request_models import ScanRequest
from app.models.response_models import ApiResponse, ScanResponse, ImageScanResponse, SignalResultDTO
from app.classifiers.classifier_pipeline import ClassifierPipeline
import asyncio
from dataclasses import asdict
import structlog

log = structlog.get_logger()

router = APIRouter(prefix="/scan", tags=["Citizen Scanner"])

def get_pipeline_dependency():
    from app.main import get_pipeline
    return get_pipeline()

@router.post("/", response_model=ApiResponse[ScanResponse])
async def scan_text(request: ScanRequest, pipeline: ClassifierPipeline = Depends(get_pipeline_dependency)):
    result = pipeline.scan(request)
    return ApiResponse.success_response(result)

@router.post("/image", response_model=ApiResponse[ImageScanResponse])
async def scan_image(file: UploadFile = File(...), pipeline: ClassifierPipeline = Depends(get_pipeline_dependency)):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, GIF, BMP"
        )
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )
        
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            pipeline.image_classifier.analyze,
            contents,
            file.filename or "upload"
        )
        
        response = ImageScanResponse(
            verdict=result.verdict.value,
            confidence=result.confidence,
            risk_score=result.risk_score,
            is_dangerous=result.is_dangerous,
            signals=[SignalResultDTO(**asdict(s)) for s in result.signals],
            ocr_text=result.ocr_text,
            scam_text_analysis=result.scam_text_analysis,
            explanation=result.explanation,
            processing_time_ms=result.processing_time_ms
        )
        
        return ApiResponse.success_response(response)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log.error("Image scan failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Image analysis failed")

from pydantic import BaseModel, Field, field_validator
from urllib.parse import urlsplit

class ShieldUrlRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)

    @field_validator("url")
    @classmethod
    def valid_url(cls, value):
        parsed = urlsplit(value)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            raise ValueError("An absolute HTTP or HTTPS URL is required")
        return value

class ShieldTextRequest(BaseModel):
    text: str = Field(min_length=3, max_length=2000)

async def shield_result(value, pipeline):
    result = await asyncio.to_thread(pipeline.scan, ScanRequest(input_text=value[:2000]))
    score = max(0, min(100, result.risk_score))
    reasons = list(result.indicators)
    if result.explanation:
        reasons.append(result.explanation)
    if "fallback" in result.classifier_used or "rule_based" in result.classifier_used:
        reasons.append("Local classification; verify unfamiliar requests independently")
    return ApiResponse.success_response({
        "verdict": "DANGEROUS" if score >= 70 else "SUSPICIOUS" if score >= 30 else "SAFE",
        "score": score, "reasons": reasons, "category": result.threat_type,
    })

@router.post("/url")
async def shield_url(request: ShieldUrlRequest, pipeline=Depends(get_pipeline_dependency)):
    return await shield_result(request.url, pipeline)

@router.post("/text")
async def shield_text(request: ShieldTextRequest, pipeline=Depends(get_pipeline_dependency)):
    return await shield_result(request.text, pipeline)
