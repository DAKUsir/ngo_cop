from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from app.models.schemas import PredictInput, PredictOutput, SentimentInput, SentimentOutput
from app.ml.predictor import predict
from app.utils.sentiment import analyze_sentiment
from app.database.mongodb import predictions_collection
from app.utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & ML"])


@router.post("/predict", response_model=PredictOutput)
async def predict_impact(
    body: PredictInput,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = predict(body.model_dump())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    doc = {
        "_id": str(uuid.uuid4()),
        "user_id": str(current_user["_id"]),
        "input": body.model_dump(),
        "output": result,
        "created_at": datetime.now(timezone.utc),
    }
    await predictions_collection.insert_one(doc)

    return PredictOutput(**result)


@router.post("/sentiment", response_model=SentimentOutput)
async def sentiment_analysis(
    body: SentimentInput,
    current_user: dict = Depends(get_current_user),
):
    if not body.texts:
        raise HTTPException(status_code=400, detail="texts list is empty")
    result = analyze_sentiment(body.texts)
    return SentimentOutput(**result)
