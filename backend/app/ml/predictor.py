"""Loads the persisted Random Forest model and exposes a predict function."""
import os
import joblib
import numpy as np

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
_clf = None


def _load_model():
    global _clf
    if _clf is None:
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(
                "ML model not found. Run: python app/ml/train_model.py"
            )
        _clf = joblib.load(_MODEL_PATH)
    return _clf


FEATURES = [
    "beneficiaries",
    "funds",
    "women_pct",
    "children_pct",
    "volunteer_count",
    "training_sessions",
    "attendance_pct",
    "feedback_score",
]


def predict(features: dict) -> dict:
    clf = _load_model()
    x = np.array([[features[f] for f in FEATURES]])
    label = clf.predict(x)[0]
    proba = clf.predict_proba(x)[0]
    confidence = round(float(max(proba)) * 100, 1)

    importance = dict(zip(FEATURES, [round(float(v) * 100, 1) for v in clf.feature_importances_]))

    return {"impact": label, "confidence": confidence, "feature_importance": importance}
