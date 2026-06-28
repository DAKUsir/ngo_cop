import io
import re
import uuid
from datetime import datetime, timezone

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from bson import ObjectId

from app.models.schemas import UploadResponse, ValidationIssue, CleaningSummary
from app.database.mongodb import uploads_collection
from app.utils.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])

EXPECTED_COLUMNS = {
    "village", "beneficiaries", "funds",
    "women", "children", "feedback",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _read_file(filename: str, content: bytes) -> pd.DataFrame:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "csv":
        return pd.read_csv(io.BytesIO(content))
    elif ext in ("xls", "xlsx"):
        return pd.read_excel(io.BytesIO(content), engine="openpyxl")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")


def _validate(df: pd.DataFrame):
    issues = []
    cols_lower = {c.lower() for c in df.columns}

    missing = EXPECTED_COLUMNS - cols_lower
    for col in missing:
        issues.append(ValidationIssue(
            type="missing_column", column=col,
            message=f"Expected column '{col}' not found",
        ))

    dup_count = df.duplicated().sum()
    if dup_count:
        issues.append(ValidationIssue(
            type="duplicate", count=int(dup_count),
            message=f"{dup_count} duplicate row(s) detected",
        ))

    null_count = int(df.isnull().sum().sum())
    if null_count:
        issues.append(ValidationIssue(
            type="empty_value", count=null_count,
            message=f"{null_count} empty cell(s) found",
        ))

    return issues


def _clean(df: pd.DataFrame):
    before_rows = len(df)
    df = df.drop_duplicates()
    duplicates_removed = before_rows - len(df)

    numeric_cols = df.select_dtypes(include="number").columns
    missing_filled = int(df[numeric_cols].isnull().sum().sum())
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].fillna("Unknown").astype(str).str.strip().str.title()

    null_rows_removed = int(df.isnull().all(axis=1).sum())
    df = df.dropna(how="all")

    return df, CleaningSummary(
        duplicates_removed=duplicates_removed,
        missing_filled=missing_filled,
        dates_standardized=0,
        null_rows_removed=null_rows_removed,
    )


@router.post("/", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    df = _read_file(file.filename, content)
    issues = _validate(df)
    df, cleaning = _clean(df)

    upload_id = str(uuid.uuid4())
    doc = {
        "_id": upload_id,
        "user_id": str(current_user["_id"]),
        "filename": file.filename,
        "rows": len(df),
        "columns": df.columns.tolist(),
        "data": df.to_dict(orient="records"),
        "uploaded_at": datetime.now(timezone.utc),
    }
    await uploads_collection.replace_one({"_id": upload_id}, doc, upsert=True)

    return UploadResponse(
        upload_id=upload_id,
        filename=file.filename,
        rows=len(df),
        columns=df.columns.tolist(),
        validation_issues=issues,
        cleaning_summary=cleaning,
        preview=df.head(5).to_dict(orient="records"),
    )
