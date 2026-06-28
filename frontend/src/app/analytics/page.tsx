"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { analyticsApi } from "@/services/api";
import { toast } from "sonner";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Brain, MessageSquare, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const SENTIMENT_COLORS = ["#10B981", "#94A3B8", "#F87171"];

const FEATURE_LABELS: Record<string, string> = {
  beneficiaries: "Beneficiaries",
  funds: "Funds (₹)",
  women_pct: "Women %",
  children_pct: "Children %",
  volunteer_count: "Volunteers",
  training_sessions: "Training Sessions",
  attendance_pct: "Attendance %",
  feedback_score: "Feedback Score",
};

export default function AnalyticsPage() {
  // ── ML Prediction ────────────────────────────────────────────
  const [predictForm, setPredictForm] = useState({
    beneficiaries: 500,
    funds: 250000,
    women_pct: 48,
    children_pct: 35,
    volunteer_count: 20,
    training_sessions: 12,
    attendance_pct: 75,
    feedback_score: 4.0,
  });
  const [prediction, setPrediction] = useState<{ impact: string; confidence: number; feature_importance: Record<string, number> } | null>(null);
  const [predicting, setPredicting] = useState(false);

  // ── Sentiment ────────────────────────────────────────────────
  const [feedbackText, setFeedbackText] = useState("The training changed my life. We received no support from officials. The program was very helpful and our children now go to school. Terrible experience, funds never reached us.");
  const [sentiment, setSentiment] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await analyticsApi.predict(predictForm);
      setPrediction(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Prediction failed. Run train_model.py first.");
    } finally {
      setPredicting(false);
    }
  };

  const handleSentiment = async () => {
    const texts = feedbackText.split(".").map((t) => t.trim()).filter(Boolean);
    if (!texts.length) return;
    setAnalysing(true);
    try {
      const res = await analyticsApi.sentiment(texts);
      setSentiment(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Sentiment analysis failed");
    } finally {
      setAnalysing(false);
    }
  };

  const impactBadgeClass = (impact: string) =>
    impact === "High" ? "badge-high" : impact === "Medium" ? "badge-medium" : "badge-low";

  const radarData = prediction
    ? Object.entries(prediction.feature_importance).map(([k, v]) => ({ subject: FEATURE_LABELS[k] ?? k, value: v }))
    : [];

  const sentimentPie = sentiment
    ? [
        { name: "Positive", value: sentiment.positive_pct },
        { name: "Neutral", value: sentiment.neutral_pct },
        { name: "Negative", value: sentiment.negative_pct },
      ]
    : [];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-3xl text-white mb-1">Analytics & AI</h1>
          <p className="text-slate-400 text-sm">ML Impact Prediction + Beneficiary Sentiment Analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── ML Impact Predictor ─────────────────────────── */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-400" /> Impact Prediction
            </h2>
            <p className="text-xs text-slate-400 mb-5">Random Forest Classifier · enter your project metrics</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {Object.entries(predictForm).map(([key, val]) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1 block">{FEATURE_LABELS[key]}</label>
                  <input
                    id={`pred-${key}`}
                    type="number"
                    value={val}
                    step={key.includes("pct") || key === "feedback_score" ? 0.1 : 1}
                    onChange={(e) => setPredictForm({ ...predictForm, [key]: parseFloat(e.target.value) })}
                    className="input-dark text-xs py-2"
                  />
                </div>
              ))}
            </div>

            <button
              id="btn-predict"
              onClick={handlePredict}
              disabled={predicting}
              className="btn-primary w-full justify-center py-3 mb-5"
            >
              {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {predicting ? "Predicting…" : "Run Prediction"}
            </button>

            {prediction && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 mb-4">
                  <div className="text-center flex-1">
                    <p className="text-xs text-slate-400 mb-1">Impact Level</p>
                    <span className={`text-lg font-bold ${impactBadgeClass(prediction.impact)}`}>
                      {prediction.impact}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-slate-400 mb-1">Confidence</p>
                    <p className="text-2xl font-display font-700 gradient-text">{prediction.confidence}%</p>
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Feature Importance</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94A3B8", fontSize: 9 }} />
                    <Radar dataKey="value" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Sentiment Analysis ──────────────────────────── */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald" /> Sentiment Analysis
            </h2>
            <p className="text-xs text-slate-400 mb-5">Paste beneficiary feedback separated by full stops</p>

            <textarea
              id="sentiment-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={6}
              placeholder="Enter beneficiary feedback here, each sentence separated by a period…"
              className="input-dark resize-none mb-4 leading-relaxed"
            />

            <button
              id="btn-sentiment"
              onClick={handleSentiment}
              disabled={analysing}
              className="btn-emerald w-full justify-center py-3 mb-5"
            >
              {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {analysing ? "Analysing…" : "Analyse Sentiment"}
            </button>

            {sentiment && (
              <div className="animate-fade-in">
                {/* Stat bars */}
                <div className="flex gap-3 mb-5">
                  {[
                    { label: "Positive", value: sentiment.positive_pct, color: "#10B981", icon: <TrendingUp className="w-4 h-4" /> },
                    { label: "Neutral",  value: sentiment.neutral_pct,  color: "#94A3B8", icon: <Minus className="w-4 h-4" /> },
                    { label: "Negative", value: sentiment.negative_pct, color: "#F87171", icon: <TrendingDown className="w-4 h-4" /> },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center p-3 rounded-xl bg-white/5">
                      <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                      <p className="text-xl font-display font-700" style={{ color: s.color }}>{s.value}%</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {sentimentPie.map((_, i) => <Cell key={i} fill={SENTIMENT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1A1730", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 12, color: "#E2E8F0" }} />
                    <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Detailed Breakdown</h4>
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                    {sentiment.breakdown?.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-white/5">
                        <span className={item.label === "Positive" ? "text-emerald" : item.label === "Negative" ? "text-red-400" : "text-slate-400"}>
                          {item.label === "Positive" ? "😊" : item.label === "Negative" ? "😞" : "😐"}
                        </span>
                        <span className="text-slate-400 leading-relaxed">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
