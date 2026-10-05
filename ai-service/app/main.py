from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import get_settings
from app.classifiers.classifier_pipeline import ClassifierPipeline
from app.routers import classify, scan
from app.models.response_models import ApiResponse

logger = structlog.get_logger()
settings = get_settings()

pipeline_instance = None


def get_pipeline() -> ClassifierPipeline:
    if pipeline_instance is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=503, detail="Analysis service is starting")
    return pipeline_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline_instance
    pipeline_instance = ClassifierPipeline(settings)
    await pipeline_instance.startup()
    logger.info("AI service ready")
    yield
    logger.info("AI service shutting down")


app = FastAPI(
    title="CrimeLens AI Service",
    description="Multilingual cybercrime threat classification for Indian digital users",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router)
app.include_router(scan.router)

Instrumentator().instrument(app).expose(app)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": pipeline_instance.transformer.loaded
        if pipeline_instance
        else False,
        "environment": settings.environment,
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ApiResponse(
            success=False,
            error="Invalid input: check required fields and length limits",
        ).model_dump(),
    )
