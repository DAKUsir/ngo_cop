# ImpactLens – NGO Impact Reporting Copilot

ImpactLens is an AI-powered platform designed to help NGOs effortlessly transform their raw field data (beneficiaries, funds, demographics) into professional, donor-ready impact reports.

## Features

- **Automated KPI Extraction**: Upload raw CSV/Excel datasets and instantly extract key performance indicators like total beneficiaries, funds utilized, cost per beneficiary, and gender ratios.
- **Storytelling Dashboard**: A responsive, interactive dashboard featuring Light/Dark mode, geographical reach charts, and resource allocation trends.
- **AI Report Generator (Groq LLaMA 3.3)**: Instantly generate full 8-section impact reports. Customize the tone of the report (Formal, Concise, or Storyline) based on your target audience.
- **PDF Export**: One-click download of a beautifully formatted PDF report containing your KPI table and the AI-generated narrative.

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, Recharts, Lucide React
- **Backend**: FastAPI (Python), Motor (async MongoDB), Groq AI SDK, Pandas, ReportLab
- **Database**: MongoDB

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Ensure you have a .env file with MONGODB_URL and GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.
