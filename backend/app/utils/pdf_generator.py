import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


# ── Colour palette ──────────────────────────────────────────────
PRIMARY   = colors.HexColor("#6C63FF")
SECONDARY = colors.HexColor("#10B981")
DARK      = colors.HexColor("#1E1B4B")
LIGHT_BG  = colors.HexColor("#F8F7FF")
GREY_TEXT = colors.HexColor("#6B7280")


def generate_pdf(
    title: str,
    org_name: str,
    period: str,
    report_content: str,
    kpi_data: dict,
) -> bytes:
    """Generate a professional NGO impact report PDF and return raw bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    h1 = ParagraphStyle(
        "H1", parent=styles["Heading1"],
        fontName="Helvetica-Bold", fontSize=22,
        textColor=DARK, alignment=TA_CENTER, spaceAfter=4,
    )
    h2 = ParagraphStyle(
        "H2", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=13,
        textColor=PRIMARY, spaceBefore=14, spaceAfter=4,
    )
    body = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10,
        textColor=colors.HexColor("#374151"),
        leading=16, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    sub = ParagraphStyle(
        "Sub", fontName="Helvetica-Oblique", fontSize=9,
        textColor=GREY_TEXT, alignment=TA_CENTER, spaceAfter=20,
    )

    story = []

    # ── Cover header ────────────────────────────────────────────
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(title, h1))
    story.append(Paragraph(f"{org_name}  ·  {period}  ·  Generated {datetime.now().strftime('%d %b %Y')}", sub))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=16))

    # ── KPI summary table ───────────────────────────────────────
    story.append(Paragraph("Key Performance Indicators", h2))
    kpi_rows = [
        ["Metric", "Value"],
        ["Total Beneficiaries",   f"{int(kpi_data.get('total_beneficiaries', 0)):,}"],
        ["Total Funds Utilised",  f"₹ {kpi_data.get('total_funds', 0):,.2f}"],
        ["Cost per Beneficiary",  f"₹ {kpi_data.get('cost_per', 0):,.2f}"],
        ["Women Beneficiaries",   f"{kpi_data.get('women_pct', 0):.1f} %"],
        ["Children Beneficiaries",f"{kpi_data.get('children_pct', 0):.1f} %"],
        ["Top Performing Village",kpi_data.get('top_village', 'N/A')],
        ["Monthly Growth",        f"{kpi_data.get('monthly_growth', 0):.1f} %"],
        ["Feedback Score",        f"{kpi_data.get('feedback_score', 0):.1f} / 5"],
    ]
    kpi_table = Table(kpi_rows, colWidths=[9 * cm, 7 * cm])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, colors.white]),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",(0, 0), (-1, -1), 10),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether(kpi_table))
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=12))

    # ── AI-generated narrative ───────────────────────────────────
    for line in report_content.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.2 * cm))
        elif line.startswith("##"):
            story.append(Paragraph(line.lstrip("# "), h2))
        elif line.startswith("#"):
            story.append(Paragraph(line.lstrip("# "), h1))
        else:
            story.append(Paragraph(line, body))

    # ── Footer note ─────────────────────────────────────────────
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8))
    story.append(Paragraph(
        "This report was generated automatically by <b>ImpactLens AI</b>. "
        "All figures are derived from the uploaded dataset.",
        ParagraphStyle("Footer", fontName="Helvetica-Oblique", fontSize=8,
                       textColor=GREY_TEXT, alignment=TA_CENTER),
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
