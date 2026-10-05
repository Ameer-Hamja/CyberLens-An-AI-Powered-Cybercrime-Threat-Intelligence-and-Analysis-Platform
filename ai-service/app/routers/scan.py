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
