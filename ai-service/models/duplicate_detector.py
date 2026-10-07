from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore[reportMissingModuleSource]
from sklearn.metrics.pairwise import cosine_similarity  # type: ignore[reportMissingModuleSource]


def calculate_similarity(text1: str, text2: str):
    """
    Calculate cosine similarity between two complaint texts.
    """

    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform([text1, text2])

    similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

    return round(float(similarity), 4)


def is_duplicate(text1: str, text2: str, threshold=0.60):
    """
    Check whether two complaints are duplicates.
    """

    similarity = calculate_similarity(text1, text2)

    return {
        "similarity": similarity,
        "duplicate": similarity >= threshold
    }


if __name__ == "__main__":
    complaint1 = input("Enter first complaint: ")
    complaint2 = input("Enter second complaint: ")

    result = is_duplicate(complaint1, complaint2)

    print("\nDuplicate Detection Result:")
    print(result)