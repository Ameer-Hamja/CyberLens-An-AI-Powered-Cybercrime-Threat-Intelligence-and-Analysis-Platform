from fastapi import APIRouter, Depends, HTTPException
import structlog
from app.models.request_models import ClassifyRequest
from app.models.response_models import ApiResponse, ClassifyResponse
from app.classifiers.classifier_pipeline import ClassifierPipeline

router = APIRouter(prefix="/classify", tags=["Classification"])
logger = structlog.get_logger()


def get_pipeline_dependency():
    from app.main import get_pipeline

    return get_pipeline()


@router.post("/", response_model=ApiResponse[ClassifyResponse])
def classify_text(
    request: ClassifyRequest,
    pipeline: ClassifierPipeline = Depends(get_pipeline_dependency),
):
    try:
        result = pipeline.classify(request)
        return ApiResponse.success_response(result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Classification failed", error=str(e))
        raise HTTPException(status_code=500, detail="Classification failed")
