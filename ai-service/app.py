from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

from models.text_classifier import classify_complaint
from models.image_classifier import classify_image
from models.duplicate_detector import is_duplicate

import tempfile
import os


# ============================================
# FASTAPI APP
# ============================================

app = FastAPI(title="CivicPulse AI Service")


# ============================================
# COMPLAINT REQUEST MODEL
# ============================================

class ComplaintRequest(BaseModel):
    text: str


# ============================================
# DUPLICATE DETECTION REQUEST MODEL
# ============================================

class DuplicateRequest(BaseModel):
    text1: str
    text2: str


class PriorityRequest(BaseModel):
    text: str
    category: str | None = None
    source: str = "citizen"


# ============================================
# HOME
# ============================================

@app.get("/")
def home():
    return {
        "message": "CivicPulse AI Service is running"
    }


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================
# TEXT CLASSIFICATION
# ============================================

@app.post("/classify")
def classify(request: ComplaintRequest):

    result = classify_complaint(
        request.text
    )

    return result


# ============================================
# DUPLICATE DETECTION
# ============================================

@app.post("/check-duplicate")
def check_duplicate(request: DuplicateRequest):

    result = is_duplicate(
        request.text1,
        request.text2
    )

    return result


@app.post("/priority")
def predict_priority(request: PriorityRequest):
    text = request.text.lower()
    critical_terms = ["accident", "fire", "flood", "electrocution", "dangerous", "overflow"]
    high_terms = ["leak", "broken", "blocked", "not working", "health", "contamination", "urgent"]
    source_weight = 0.15 if request.source == "iot" else 0

    if any(term in text for term in critical_terms):
        severity, priority, score = "Critical", "Critical", 0.95
    elif any(term in text for term in high_terms):
        severity, priority, score = "High", "High", 0.78
    elif request.category in {"Drainage", "Water Supply"}:
        severity, priority, score = "Medium", "Medium", 0.58
    else:
        severity, priority, score = "Low", "Medium", 0.42

    return {
        "priority": priority,
        "severity": severity,
        "score": round(min(1.0, score + source_weight), 4),
        "method": "rule-based-v1",
    }


# ============================================
# IMAGE CLASSIFICATION
# ============================================

@app.post("/classify-image")
async def classify_image_endpoint(
    file: UploadFile = File(...)
):

    temp_path = None

    try:

        # Read uploaded image
        image_data = await file.read()

        # Get file extension
        extension = os.path.splitext(
            file.filename or ""
        )[1]

        # Create temporary image file
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            temp_file.write(image_data)

            temp_path = temp_file.name

        # Run CLIP image classification
        result = classify_image(
            temp_path
        )

        return result

    except Exception as error:

        print(
            "Image classification error:",
            error
        )

        return {
            "message": "Image classification failed",
            "error": str(error)
        }

    finally:

        # Delete temporary file
        if temp_path and os.path.exists(temp_path):

            os.remove(temp_path)