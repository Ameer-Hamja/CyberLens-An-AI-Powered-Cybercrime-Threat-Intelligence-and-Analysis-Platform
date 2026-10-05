from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict


class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    source_url: Optional[str] = None
    raw_metadata: Dict[str, str] = Field(default_factory=dict)

    @field_validator("text")
    def text_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("text cannot be blank after stripping whitespace")
        return stripped


class ScanRequest(BaseModel):
    input_text: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="URL, SMS text, UPI ID, or phone number to scan",
    )

    @field_validator("input_text")
    def input_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("input_text cannot be blank")
        return stripped


class ImageScanRequest(BaseModel):
    pass
