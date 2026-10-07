from importlib import import_module


_classifier = None


def _get_classifier():
    """Load the classifier only when it is needed."""
    global _classifier

    if _classifier is None:
        try:
            pipeline = import_module("transformers").pipeline
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "Install the required dependencies with: "
                "pip install transformers torch"
            ) from exc

        _classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )

    return _classifier


CATEGORIES = [
    "Garbage",
    "Potholes",
    "Water Supply",
    "Drainage",
    "Street Lights"
]


DEPARTMENTS = {
    "Garbage": "Sanitation",
    "Potholes": "Roads",
    "Water Supply": "Water Supply",
    "Drainage": "Drainage",
    "Street Lights": "Street Lighting"
}


def classify_complaint(text: str):
    """
    Classify a citizen complaint into a CivicPulse category
    and automatically determine the responsible department.
    """


    result = _get_classifier()(
        text,
        candidate_labels=CATEGORIES
    )

    category = result["labels"][0]
    confidence = result["scores"][0]

    department = DEPARTMENTS.get(category, "Unknown")

    return {
        "category": category,
        "department": department,
        "confidence": round(float(confidence), 4)
    }


if __name__ == "__main__":
    complaint = input("Enter complaint: ")

    result = classify_complaint(complaint)

    print("\nAI Classification Result:")
    print(result)