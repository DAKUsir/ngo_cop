"use client";
import Link from "next/link";
import { ArrowRight, BarChart3, Brain, FileText, Shield, Upload, Zap, Star, CheckCircle } from "lucide-react";

const features = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Smart Data Upload",
    desc: "Drop CSV, Excel, or PDF files. AI auto-validates, cleans duplicates, and standardises formats instantly.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Live KPI Dashboard",
    desc: "Total beneficiaries, funds, gender breakdown, top villages, monthly trends — all auto-extracted.",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "ML Impact Prediction",
    desc: "Random Forest Classifier predicts High / Medium / Low impact with 90%+ accuracy on your data.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Sentiment Analysis",
    desc: "TextBlob analyses beneficiary feedback and surfaces positive, neutral, negative sentiment percentages.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "AI Report Writer",
    desc: "Gemini AI writes a full 8-section donor report — Executive Summary, Impact, Challenges, Recommendations.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "PDF Export",
    desc: "Download a branded, professional PDF with KPI tables, narrative, and your organisation logo.",
    color: "from-indigo-500 to-violet-600",
  },
];

const stats = [
  { value: "90%+", label: "ML Accuracy" },
  { value: "8", label: "Report Sections" },
  { value: "5min", label: "End-to-End" },
  { value: "100%", label: "Automated" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-emerald flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-lg text-white">Impact<span className="gradient-text">Lens</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link href="/login?mode=register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        {/* Orbs */}
        <div className="orb orb-purple w-96 h-96 top-10 -left-24" style={{ animationDelay: "0s" }} />
        <div className="orb orb-emerald w-80 h-80 top-32 right-0" style={{ animationDelay: "3s" }} />
        <div className="orb orb-cyan w-64 h-64 bottom-0 left-1/3" style={{ animationDelay: "1.5s" }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-primary-300 border border-primary-500/20">
            <Star className="w-3.5 h-3.5 fill-primary-400 text-primary-400" />
            AI-Powered NGO Impact Reporting
            <Star className="w-3.5 h-3.5 fill-primary-400 text-primary-400" />
          </div>

          <h1 className="font-display font-900 text-5xl md:text-7xl text-white mb-6 leading-tight">
            Turn Raw Data Into<br />
            <span className="gradient-text">Donor-Ready Reports</span><br />
            in Minutes
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            ImpactLens automates the full NGO reporting workflow — from messy spreadsheets to
            polished AI-written reports with KPIs, ML predictions, sentiment analysis, and PDF export.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login?mode=register" className="btn-primary text-base px-8 py-4">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">
              View Dashboard Demo
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {["Gemini AI", "MongoDB Atlas", "Random Forest ML", "ReportLab PDF", "TextBlob Sentiment"].map((t) => (
              <span key={t} className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.value} className="stat-card text-center">
              <div className="text-4xl font-display font-800 gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-700 text-4xl md:text-5xl text-white mb-4">
              Everything an NGO Needs
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Six powerful AI-driven modules that transform raw beneficiary data into actionable insights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 group hover:border-primary-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-700 text-4xl text-white mb-4">How It Works</h2>
            <p className="text-slate-400">From upload to report in 6 automated steps</p>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { step: "01", title: "Upload Dataset", desc: "Drag & drop CSV, Excel, or PDF files" },
              { step: "02", title: "Auto Validate & Clean", desc: "AI detects issues and fixes duplicates, nulls, formats" },
              { step: "03", title: "Extract KPIs", desc: "Beneficiaries, funds, gender %, top villages auto-calculated" },
              { step: "04", title: "ML Impact Score", desc: "Random Forest predicts High/Medium/Low impact" },
              { step: "05", title: "Sentiment Analysis", desc: "Beneficiary feedback classified automatically" },
              { step: "06", title: "Generate & Download", desc: "Gemini writes full report, export to PDF" },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-bold text-sm group-hover:bg-primary-500/30 transition-colors">
                    {item.step}
                  </div>
                  {i < 5 && <div className="w-0.5 h-12 bg-gradient-to-b from-primary-500/40 to-transparent" />}
                </div>
                <div className="pb-10">
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-16 relative overflow-hidden">
          <div className="orb orb-purple w-64 h-64 -top-12 -right-12 opacity-20" />
          <div className="orb orb-emerald w-48 h-48 -bottom-8 -left-8 opacity-20" />
          <h2 className="font-display font-800 text-4xl text-white mb-4 relative">
            Ready to Transform Your<br /><span className="gradient-text">Impact Reporting?</span>
          </h2>
          <p className="text-slate-400 mb-8 relative">
            Sign up free and generate your first AI report in under 5 minutes.
          </p>
          <Link href="/login?mode=register" className="btn-primary text-base px-10 py-4 relative">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-primary-500" />
          <span className="font-display font-semibold text-white">ImpactLens</span>
        </div>
        <p>AI-Powered NGO Impact Reporting Copilot · Built with Next.js, FastAPI, Gemini & MongoDB</p>
      </footer>
    </div>
  );
}
