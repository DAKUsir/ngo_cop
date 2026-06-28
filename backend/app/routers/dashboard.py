import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from app.models.schemas import KPIData
from app.database.mongodb import uploads_collection
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        matches = [col for col in df.columns if c.lower() in col.lower()]
        if matches:
            return matches[0]
    return None


@router.get("/kpis", response_model=KPIData)
async def get_kpis(
    upload_id: str = Query(..., description="Upload ID from /upload"),
    current_user: dict = Depends(get_current_user),
):
    doc = await uploads_collection.find_one({"_id": upload_id, "user_id": str(current_user["_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Upload not found")

    df = pd.DataFrame(doc["data"])
    if df.empty:
        raise HTTPException(status_code=422, detail="Dataset is empty")

    # ── Column detection ────────────────────────────────────────
    ben_col     = _find_col(df, ["beneficiar", "beneficiary", "people"])
    funds_col   = _find_col(df, ["fund", "amount", "budget", "money"])
    women_col   = _find_col(df, ["women", "female", "girl"])
    child_col   = _find_col(df, ["child", "minor", "kid"])
    village_col = _find_col(df, ["village", "location", "area", "district"])
    feedback_col= _find_col(df, ["feedback", "score", "rating", "satisfaction"])
    volunteer_col= _find_col(df, ["volunteer", "staff", "worker"])

    def safe_num(col):
        if col and col in df.columns:
            return pd.to_numeric(df[col], errors="coerce").fillna(0)
        return pd.Series([0] * len(df))

    beneficiaries = safe_num(ben_col)
    funds         = safe_num(funds_col)
    women         = safe_num(women_col)
    children      = safe_num(child_col)
    feedback      = safe_num(feedback_col)
    volunteers    = safe_num(volunteer_col)

    total_ben  = int(beneficiaries.sum())
    total_fund = float(funds.sum())
    proj_count = len(df)
    avg_funds  = total_fund / proj_count if proj_count else 0
    cost_per   = total_fund / total_ben if total_ben else 0
    women_pct  = float((women.sum() / total_ben * 100)) if total_ben else 0
    child_pct  = float((children.sum() / total_ben * 100)) if total_ben else 0
    fb_score   = float(feedback.mean()) if feedback.any() else 0
    vol_hours  = float(volunteers.sum()) * 8  # assume 8 hrs/volunteer

    # Top village
    top_village = "N/A"
    if village_col and ben_col:
        top = df.groupby(village_col)[ben_col].sum().idxmax()
        top_village = str(top)

    # Monthly growth (mock if no date col)
    monthly_growth = round(float(beneficiaries.pct_change().mean() * 100), 1) if len(df) > 1 else 5.0

    # Chart data
    if village_col and ben_col:
        bar = df.groupby(village_col)[ben_col].sum().reset_index()
        bar_chart = [{"name": str(r[village_col]), "beneficiaries": int(r[ben_col])} for _, r in bar.iterrows()]
    else:
        bar_chart = [{"name": f"Project {i+1}", "beneficiaries": int(v)} for i, v in enumerate(beneficiaries[:10])]

    pie_chart = [
        {"name": "Women",    "value": round(women_pct, 1)},
        {"name": "Children", "value": round(child_pct, 1)},
        {"name": "Others",   "value": round(max(0, 100 - women_pct - child_pct), 1)},
    ]

    line_chart = [
        {"month": f"M{i+1}", "beneficiaries": int(v), "funds": round(float(funds.iloc[i]) if funds_col else 0, 0)}
        for i, v in enumerate(beneficiaries[:12])
    ]

    return KPIData(
        total_beneficiaries=total_ben,
        total_funds=total_fund,
        avg_funds_per_project=avg_funds,
        women_percentage=women_pct,
        children_percentage=child_pct,
        cost_per_beneficiary=cost_per,
        top_village=top_village,
        monthly_growth=monthly_growth,
        volunteer_hours=vol_hours,
        feedback_score=fb_score,
        projects_count=proj_count,
        bar_chart=bar_chart[:20],
        pie_chart=pie_chart,
        line_chart=line_chart,
    )
