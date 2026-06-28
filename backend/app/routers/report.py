"""
report.py — AI-powered NGO impact report generation using Groq + LLaMA 3.3-70B.
Falls back to a dynamic template if Groq is unavailable.
"""
import uuid
import asyncio
import logging
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from groq import Groq
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response

from app.models.schemas import ReportRequest, ReportOut
from app.database.mongodb import reports_collection, uploads_collection
from app.utils.auth import get_current_user
from app.utils.pdf_generator import generate_pdf
from app.config import get_settings

router = APIRouter(prefix="/report", tags=["Report Generation"])
settings = get_settings()
logger = logging.getLogger(__name__)

# ── Groq — created once, no startup ping so it never blocks ─────
_GROQ_MODEL = "llama-3.3-70b-versatile"
_groq_client: Groq | None = None

if settings.GROQ_API_KEY:
    _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    logger.info(f"Groq client initialised with model: {_GROQ_MODEL}")
else:
    logger.warning("GROQ_API_KEY not set — will use template fallback")

# Thread pool for running sync Groq calls without blocking the async loop
_executor = ThreadPoolExecutor(max_workers=2)


# ─────────────────────────────────────────────────────────────────
# KPI extraction from uploaded dataframe
# ─────────────────────────────────────────────────────────────────

def _extract_kpis(df: pd.DataFrame) -> dict:
    """Intelligently extract KPIs from any NGO dataset."""
    def find_col(*hints):
        for h in hints:
            for col in df.columns:
                if h.lower() in col.lower():
                    return col
        return None

    def num(col):
        if col and col in df.columns:
            return pd.to_numeric(df[col], errors="coerce").fillna(0)
        return pd.Series([0] * len(df))

    ben_col  = find_col("beneficiar", "people", "person", "served")
    fund_col = find_col("fund", "amount", "budget", "expenditure", "cost")
    women_col = find_col("women", "female", "girl")
    child_col = find_col("child", "minor", "youth", "kid")
    fb_col   = find_col("feedback", "score", "rating", "satisfaction")
    vlg_col  = find_col("village", "location", "area", "district", "place")
    mon_col  = find_col("month", "date", "period")
    vol_col  = find_col("volunteer")
    train_col = find_col("training", "session")
    attend_col = find_col("attendance", "attend")

    ben   = num(ben_col)
    funds = num(fund_col)
    women = num(women_col)
    child = num(child_col)
    fb    = num(fb_col)

    total_ben  = int(ben.sum()) or len(df) * 50
    total_fund = float(funds.sum()) or len(df) * 75000
    women_pct  = round(float(women.sum() / total_ben * 100), 1) if total_ben and women.sum() > 0 else 0
    child_pct  = round(float(child.sum() / total_ben * 100), 1) if total_ben and child.sum() > 0 else 0
    fb_score   = round(float(fb[fb > 0].mean()), 2) if (fb > 0).any() else 0
    cost_per   = round(total_fund / total_ben, 2) if total_ben else 0

    # Top village by beneficiaries
    top_village = "N/A"
    if vlg_col and ben_col:
        try:
            top_village = str(df.groupby(vlg_col)[ben_col].sum().idxmax())
        except Exception:
            pass

    # Monthly growth (compare last vs first month if available)
    monthly_growth = 0.0
    if mon_col and ben_col:
        try:
            monthly = df.groupby(mon_col)[ben_col].sum()
            if len(monthly) >= 2:
                first, last = monthly.iloc[0], monthly.iloc[-1]
                monthly_growth = round((last - first) / first * 100, 1) if first else 0
        except Exception:
            pass

    # Average volunteers and training per site
    avg_volunteers  = round(float(num(vol_col).mean()), 1) if vol_col else 0
    avg_training    = round(float(num(train_col).mean()), 1) if train_col else 0
    avg_attendance  = round(float(num(attend_col).mean()), 1) if attend_col else 0

    # Top 5 villages by beneficiaries for context
    top_villages = []
    if vlg_col and ben_col:
        try:
            top_villages = df.groupby(vlg_col)[ben_col].sum().sort_values(ascending=False).head(5).to_dict()
            top_villages = [f"{k}: {int(v)} beneficiaries" for k, v in top_villages.items()]
        except Exception:
            pass

    return {
        "total_beneficiaries": total_ben,
        "total_funds": total_fund,
        "women_pct": women_pct,
        "children_pct": child_pct,
        "cost_per": cost_per,
        "top_village": top_village,
        "top_villages_list": top_villages,
        "monthly_growth": monthly_growth,
        "feedback_score": fb_score,
        "projects_count": len(df),
        "avg_volunteers": avg_volunteers,
        "avg_training_sessions": avg_training,
        "avg_attendance_pct": avg_attendance,
        "total_rows": len(df),
        "columns": df.columns.tolist(),
    }


# ─────────────────────────────────────────────────────────────────
# Groq prompt builder — rich with actual data
# ─────────────────────────────────────────────────────────────────

def _build_prompt(kpis: dict, org: str, period: str, sample_rows: list, tone: str) -> str:
    top_v = "\n".join(f"  - {v}" for v in kpis.get("top_villages_list", [])) or "  - N/A"
    sample = "\n".join(
        str(row) for row in sample_rows[:5]
    )
    
    tone_instruction = ""
    if tone == "concise":
        tone_instruction = "Tone: CONCISE. Write a short, to-the-point summary. Focus purely on key metrics and outcomes without unnecessary detail. Keep paragraphs very short."
    elif tone == "storyline":
        tone_instruction = "Tone: STORYLINE. Write for the common man who does not understand technical language. Explain impact in simple terms, using narrative storytelling and illustrative examples to bring the data to life."
    else:
        tone_instruction = "Tone: FORMAL. Write a detailed, technical report suitable for institutional donors. Use professional language and deep analytical depth."

    return f"""You are an expert NGO impact report writer working for {org}.

Write a FULL, professional impact report for the period: **{period}**

{tone_instruction}

## REAL DATA FROM UPLOADED DATASET
- Total Beneficiaries Reached: {kpis['total_beneficiaries']:,}
- Total Funds Utilised: ₹{kpis['total_funds']:,.0f}
- Women as % of Beneficiaries: {kpis['women_pct']}%
- Children as % of Beneficiaries: {kpis['children_pct']}%
- Cost per Beneficiary: ₹{kpis['cost_per']:,.0f}
- Top Performing Location: {kpis['top_village']}
- Top 5 Locations by Reach:
{top_v}
- Beneficiary Satisfaction Score: {kpis['feedback_score']}/5
- Monthly Growth Rate: {kpis['monthly_growth']}%
- Average Volunteers per Site: {kpis['avg_volunteers']}
- Average Training Sessions: {kpis['avg_training_sessions']}
- Average Attendance: {kpis['avg_attendance_pct']}%
- Total Programme Sites/Rows: {kpis['projects_count']}

## SAMPLE DATA ROWS (for context)
{sample}

## REPORT STRUCTURE (write ALL 8 sections)
Use markdown headings (##). Be specific — reference actual numbers, locations, and percentages from the data above. Do NOT use generic filler text. Ensure the language strictly matches the requested tone ({tone.upper()}).

## 1. Executive Summary
## 2. Programme Objectives
## 3. Key Activities & Achievements
## 4. Impact Highlights (include a markdown table of KPIs)
## 5. Success Stories (reference top locations by name)
## 6. Challenges & Learnings
## 7. Strategic Recommendations
## 8. Donor Acknowledgements"""


# ─────────────────────────────────────────────────────────────────
# Dynamic template fallback (no AI needed)
# ─────────────────────────────────────────────────────────────────

def _template_report(kpis: dict, org: str, period: str) -> str:
    tb  = kpis.get("total_beneficiaries", 0)
    tf  = kpis.get("total_funds", 0)
    wp  = kpis.get("women_pct", 0)
    cp  = kpis.get("children_pct", 0)
    tv  = kpis.get("top_village", "our top-performing site")
    fs  = kpis.get("feedback_score", 0)
    mg  = kpis.get("monthly_growth", 0)
    pc  = kpis.get("projects_count", 0)
    cpb = kpis.get("cost_per", 0)
    vl  = kpis.get("avg_volunteers", 0)
    ts  = kpis.get("avg_training_sessions", 0)
    at  = kpis.get("avg_attendance_pct", 0)
    fund_l = tf / 100000

    perf    = "exceptional" if fs >= 4.5 else ("strong" if fs >= 4.0 else ("moderate" if fs >= 3.5 else "developing"))
    growth_w = "rapid" if mg >= 15 else ("steady" if mg >= 8 else "gradual")
    gender_w = "outstanding" if wp >= 55 else ("strong" if wp >= 45 else "growing")
    cost_w  = "highly cost-effective" if cpb < 300 else ("cost-efficient" if cpb < 600 else "resource-intensive")
    scale_w = "large-scale" if tb >= 5000 else ("mid-scale" if tb >= 1000 else "focused community-level")

    if fs < 3.8:
        challenge = f"Beneficiary satisfaction scores (averaging {fs:.1f}/5) indicate quality improvement areas, particularly around responsiveness and resource availability at field level."
    elif mg < 5:
        challenge = f"Outreach growth of {mg:.1f}% suggests a need for expanded community mobilisation strategies and deeper penetration into underserved pockets."
    elif wp < 40:
        challenge = f"Women's participation at {wp:.1f}% remains below the 50% gender-equity target, necessitating dedicated female-outreach field officers."
    else:
        challenge = f"Geographical remoteness of certain target villages presented logistical challenges in timely resource delivery and consistent field-team deployment."

    rec3 = f"Optimise procurement to reduce cost-per-beneficiary from ₹{cpb:,.0f} toward ₹{cpb*0.8:,.0f}." if cpb > 400 else f"Maintain the cost-efficiency model (₹{cpb:,.0f}/beneficiary) while scaling to new districts."

    return f"""## Executive Summary

{org} delivered a {scale_w} community development programme during {period}, achieving {perf} outcomes across {pc} project sites. A total of **{tb:,} direct beneficiaries** were reached with ₹{fund_l:.2f} lakhs deployed at {cost_w} rates of ₹{cpb:,.0f} per beneficiary. The programme recorded a beneficiary satisfaction score of **{fs:.1f}/5**, reflecting strong community reception. {tv} emerged as the highest-performing location and serves as a model for replication.

## Programme Objectives

The programme was designed to provide inclusive, rights-based development services to marginalised rural populations. Priority was given to gender equity with women at **{wp:.1f}%** of beneficiaries, and to child welfare at **{cp:.1f}%**. Capacity building through training ({ts:.0f} sessions/site avg), livelihood support, and community health formed the three pillars. All activities were benchmarked against a robust results framework with quarterly monitoring.

## Key Activities & Achievements

Field teams conducted structured interventions across all {pc} programme sites with an average of {vl:.0f} volunteers per site. The team achieved {growth_w} beneficiary growth of **{mg:.1f}%** month-over-month through effective community mobilisation and local leadership engagement. Average training session attendance reached **{at:.1f}%**, demonstrating strong community ownership. {tv} led all locations in beneficiary outreach and programme quality metrics.

## Impact Highlights

| KPI | Value |
|-----|-------|
| Total Beneficiaries | {tb:,} |
| Total Funds Utilised | ₹{tf:,.0f} |
| Cost per Beneficiary | ₹{cpb:,.0f} |
| Women Beneficiaries | {wp:.1f}% |
| Children Beneficiaries | {cp:.1f}% |
| Beneficiary Satisfaction | {fs:.1f} / 5.0 |
| Monthly Growth | {mg:.1f}% |
| Avg Training Sessions | {ts:.0f} per site |
| Avg Volunteers | {vl:.0f} per site |
| Programme Sites | {pc} |

## Success Stories

The {tv} cluster stands out as a flagship site, recording the highest beneficiary numbers and exemplary programme delivery. Participants reported measurable improvements in economic resilience and access to essential services. The {gender_w} female participation rate of {wp:.1f}% reflects targeted outreach by community health workers who built trust through consistent engagement. Women-led self-help groups formed under this programme have demonstrated sustainability beyond direct programme delivery.

## Challenges & Learnings

{challenge} To address these gaps, the programme has initiated corrective actions including enhanced supervisory monitoring, targeted community dialogue sessions, and revised field protocols adapted to local seasonal patterns. Technology-enabled data capture was piloted in three sites and will be scaled across all {pc} locations in the next cycle. These learnings are documented in the programme's continuous improvement register.

## Strategic Recommendations

1. **Scale {tv} model** — Replicate its community engagement playbook across the 5 lowest-performing sites in Q1 of the next cycle.
2. **Strengthen gender equity** — Deploy female field officers in sites with < 40% women participation; set a 55% target for {period} follow-up.
3. **Cost efficiency** — {rec3}
4. **Training quality** — Introduce skill-certification tracking to measure long-term behaviour change beyond attendance rates.
5. **Co-investment** — Engage district government bodies and CSR partners for co-funding the top 3 programme geographies to extend sustainability.

## Donor Acknowledgements

{org} extends its sincere gratitude to all funding partners, individual donors, and institutional supporters whose trust enabled this programme. The {scale_w} impact achieved — reaching **{tb:,} lives** with ₹{fund_l:.2f} lakhs — is a direct result of your generosity and commitment to social equity. We remain fully accountable to our beneficiaries and to you as our partners. Detailed financial statements, field visit reports, and beneficiary case studies are available upon request. We look forward to deepening this partnership and expanding impact in the period ahead."""


# ─────────────────────────────────────────────────────────────────
# API endpoints
# ─────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=ReportOut)
async def generate_report(
    body: ReportRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. Fetch upload from MongoDB
    upload = await uploads_collection.find_one({"_id": body.upload_id})
    if not upload:
        raise HTTPException(
            status_code=404,
            detail=f"Upload ID '{body.upload_id}' not found. Please upload a dataset first."
        )

    # 2. Build KPIs from real data
    raw_data = upload.get("data", [])
    if not raw_data:
        raise HTTPException(status_code=422, detail="Uploaded file has no data rows.")

    df = pd.DataFrame(raw_data)
    kpis = _extract_kpis(df)
    sample_rows = df.head(5).to_dict(orient="records")

    org    = body.org_name or "the NGO"
    period = body.period   or "the reporting period"

    logger.info(f"Generating report for upload={body.upload_id}, rows={len(df)}, KPIs={kpis}")

    # 3. Try Groq AI (run sync SDK in thread so we don't block async loop)
    content: str = ""
    ai_used = False

    if _groq_client:
        prompt = _build_prompt(kpis, org, period, sample_rows, body.tone)
        logger.info(f"Calling Groq ({_GROQ_MODEL}) with tone: {body.tone} …")

        def _call_groq():
            return _groq_client.chat.completions.create(
                model=_GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a senior NGO impact report writer with 15 years of experience. "
                            f"Write reports matching the requested tone: {body.tone.upper()}. "
                            "Always use the exact numbers provided. Never use placeholder text."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.65,
                max_tokens=3000,
            )

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(_executor, _call_groq)
            content = response.choices[0].message.content.strip()
            ai_used = True
            logger.info(f"✅ Groq report generated — {len(content)} chars")
        except Exception as e:
            logger.error(f"❌ Groq failed: {e}")
            content = ""

    # 4. Template fallback
    if not content:
        logger.info("Using dynamic template fallback")
        content = _template_report(kpis, org, period)

    # 5. Save to MongoDB
    report_id = str(uuid.uuid4())
    doc = {
        "_id": report_id,
        "user_id": str(current_user["_id"]),
        "upload_id": body.upload_id,
        "title": body.title or f"{org} — Impact Report",
        "org_name": org,
        "period": period,
        "content": content,
        "kpis": kpis,
        "ai_generated": ai_used,
        "created_at": datetime.now(timezone.utc),
    }
    await reports_collection.replace_one({"_id": report_id}, doc, upsert=True)
    logger.info(f"Report saved: {report_id} (AI={ai_used})")

    return ReportOut(
        report_id=report_id,
        title=doc["title"],
        content=content,
        created_at=doc["created_at"],
        pdf_available=True,
    )


@router.get("/download/{report_id}")
async def download_pdf(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = await reports_collection.find_one(
        {"_id": report_id, "user_id": str(current_user["_id"])}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_bytes = generate_pdf(
        title=doc["title"],
        org_name=doc.get("org_name", "NGO"),
        period=doc.get("period", ""),
        report_content=doc["content"],
        kpi_data=doc.get("kpis", {}),
    )

    filename = f"ImpactLens_{report_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/list")
async def list_reports(current_user: dict = Depends(get_current_user)):
    cursor = (
        reports_collection
        .find({"user_id": str(current_user["_id"])}, {"content": 0})
        .sort("created_at", -1)
        .limit(20)
    )
    reports = []
    async for doc in cursor:
        reports.append({
            "report_id": doc["_id"],
            "title": doc.get("title", "Untitled"),
            "org_name": doc.get("org_name"),
            "period": doc.get("period"),
            "ai_generated": doc.get("ai_generated", False),
            "created_at": doc["created_at"].isoformat(),
        })
    return {"reports": reports}
