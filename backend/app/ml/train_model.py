"""
ML Training Script for ImpactLens
Run once to generate and persist the Random Forest model:
    python app/ml/train_model.py
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
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


def generate_synthetic_data(n: int = 1000):
    np.random.seed(42)

    beneficiaries   = np.random.randint(50, 5000, n).astype(float)
    funds           = np.random.uniform(10_000, 2_000_000, n)
    women_pct       = np.random.uniform(10, 90, n)
    children_pct    = np.random.uniform(5, 60, n)
    volunteer_count = np.random.randint(2, 200, n).astype(float)
    training_sess   = np.random.randint(0, 50, n).astype(float)
    attendance_pct  = np.random.uniform(20, 100, n)
    feedback_score  = np.random.uniform(1, 5, n)

    # Composite score to create labels
    score = (
        (beneficiaries / 5000) * 25
        + (funds / 2_000_000) * 20
        + (women_pct / 100) * 15
        + (attendance_pct / 100) * 20
        + (feedback_score / 5) * 20
    )

    labels = np.where(score >= 55, "High", np.where(score >= 35, "Medium", "Low"))

    X = np.column_stack([
        beneficiaries, funds, women_pct, children_pct,
        volunteer_count, training_sess, attendance_pct, feedback_score,
    ])
    return X, labels


def train():
    print("Generating synthetic training data …")
    X, y = generate_synthetic_data(1200)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc * 100:.1f} %")
    print(classification_report(y_test, y_pred))

    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    train()
