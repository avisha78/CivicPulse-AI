try:
    # Import dynamically so the service can start even when the optional
    # transformers dependency is not installed in the active environment.
    from importlib import import_module

    pipeline = import_module("transformers").pipeline
except ImportError as exc:
    raise RuntimeError(
        "The image classifier requires the 'transformers' package. "
        "Install it with: pip install transformers"
    ) from exc


# ============================================================
# CIVICPULSE AI - IMAGE CLASSIFIER
# Dataset-free image classification using CLIP
# ============================================================

# Load pretrained CLIP vision-language model
classifier = pipeline(
    "zero-shot-image-classification",
    model="openai/clip-vit-base-patch32"
)


# CivicPulse complaint categories
CATEGORIES = [
    "garbage problem",
    "pothole on road",
    "water supply problem",
    "drainage problem",
    "street light problem"
]


# Department mapping
DEPARTMENTS = {
    "garbage problem": "Sanitation",
    "pothole on road": "Roads",
    "water supply problem": "Water Supply",
    "drainage problem": "Drainage",
    "street light problem": "Street Lighting"
}


# User-friendly category names
CATEGORY_NAMES = {
    "garbage problem": "Garbage",
    "pothole on road": "Potholes",
    "water supply problem": "Water Supply",
    "drainage problem": "Drainage",
    "street light problem": "Street Lights"
}


def classify_image(image_path: str):
    """
    Classify a civic issue image using CLIP.

    No CivicPulse-specific training dataset is required.
    The image is compared against predefined CivicPulse
    complaint categories.
    """

    results = classifier(
        image_path,
        candidate_labels=CATEGORIES
    )

    # Highest-scoring category
    top_result = results[0]

    detected_category = top_result["label"]
    confidence = top_result["score"]

    category = CATEGORY_NAMES.get(
        detected_category,
        detected_category
    )

    department = DEPARTMENTS.get(
        detected_category,
        "Unknown"
    )

    return {
        "category": category,
        "department": department,
        "confidence": round(float(confidence), 4)
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    image_path = input("Enter image path: ")

    result = classify_image(image_path)

    print("\nCivicPulse CNN Result:")
    print(result)