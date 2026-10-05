import pytest

@pytest.fixture(autouse=True)
def rule_based_pipeline(monkeypatch, request):
    # TestClient without a context manager does not run FastAPI lifespan.
    # Exercise the real CPU pipeline without downloading models in CI.
    if request.module.__name__.split(".")[-1] not in {"test_classify", "test_scan", "test_image_classifier"}:
        return
    from app.classifiers.classifier_pipeline import ClassifierPipeline
    from app.config import get_settings
    import app.main as main
    monkeypatch.setattr(main, "pipeline_instance", ClassifierPipeline(get_settings()))
