from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    organization: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    organization: Optional[str] = None
    role: str = "user"
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Upload Schemas ──────────────────────────────────────────────
class ValidationIssue(BaseModel):
    type: str          # "missing_column" | "duplicate" | "invalid_date" | "empty_value"
    column: Optional[str] = None
    count: Optional[int] = None
    message: str


class CleaningSummary(BaseModel):
    duplicates_removed: int
    missing_filled: int
    dates_standardized: int
    null_rows_removed: int


class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    rows: int
    columns: List[str]
    validation_issues: List[ValidationIssue]
    cleaning_summary: CleaningSummary
    preview: List[dict]


# ─── KPI Schemas ─────────────────────────────────────────────────
class KPIData(BaseModel):
    total_beneficiaries: int
    total_funds: float
    avg_funds_per_project: float
    women_percentage: float
    children_percentage: float
    cost_per_beneficiary: float
    top_village: str
    monthly_growth: float
    volunteer_hours: float
    feedback_score: float
    projects_count: int
    bar_chart: List[dict]
    pie_chart: List[dict]
    line_chart: List[dict]


# ─── Prediction Schemas ──────────────────────────────────────────
class PredictInput(BaseModel):
    beneficiaries: float
    funds: float
    women_pct: float
    children_pct: float
    volunteer_count: float
    training_sessions: float
    attendance_pct: float
    feedback_score: float


class PredictOutput(BaseModel):
    impact: str          # "High" | "Medium" | "Low"
    confidence: float
    feature_importance: dict


# ─── Sentiment Schemas ───────────────────────────────────────────
class SentimentInput(BaseModel):
    texts: List[str]


class SentimentOutput(BaseModel):
    positive_pct: float
    neutral_pct: float
    negative_pct: float
    total: int
    breakdown: List[dict]


# ─── Report Schemas ──────────────────────────────────────────────
class ReportRequest(BaseModel):
    upload_id: str
    title: Optional[str] = "NGO Impact Report"
    org_name: Optional[str] = "Our NGO"
    period: Optional[str] = "Q1 2024"
    tone: Optional[str] = "formal"


class ReportOut(BaseModel):
    report_id: str
    title: str
    content: str
    created_at: datetime
    pdf_available: bool
