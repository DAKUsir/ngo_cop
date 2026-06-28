from textblob import TextBlob
from typing import List


def analyze_sentiment(texts: List[str]) -> dict:
    """Run TextBlob sentiment analysis on a list of text strings."""
    results = []
    positive = 0
    neutral = 0
    negative = 0

    for text in texts:
        if not text or not str(text).strip():
            continue
        blob = TextBlob(str(text))
        polarity = blob.sentiment.polarity

        if polarity > 0.05:
            label = "Positive"
            positive += 1
        elif polarity < -0.05:
            label = "Negative"
            negative += 1
        else:
            label = "Neutral"
            neutral += 1

        results.append({
            "text": text[:120],
            "label": label,
            "polarity": round(polarity, 3),
        })

    total = len(results)
    if total == 0:
        return {
            "positive_pct": 0,
            "neutral_pct": 0,
            "negative_pct": 0,
            "total": 0,
            "breakdown": [],
        }

    return {
        "positive_pct": round(positive / total * 100, 1),
        "neutral_pct": round(neutral / total * 100, 1),
        "negative_pct": round(negative / total * 100, 1),
        "total": total,
        "breakdown": results,
    }
