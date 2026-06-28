"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { reportApi } from "@/services/api";
import { toast } from "sonner";
import { FileText, Loader2, Download, ChevronDown, ChevronUp, Calendar, Building2, Clock } from "lucide-react";

interface Report {
  report_id: string;
  title: string;
  org_name: string;
  period: string;
  created_at: string;
}

export default function ReportPage() {
  const [uploadId, setUploadId] = useState("");
  const [title, setTitle] = useState("NGO Annual Impact Report 2024");
  const [orgName, setOrgName] = useState("");
  const [period, setPeriod] = useState("January – December 2024");
  const [tone, setTone] = useState<"formal" | "concise" | "storyline">("formal");
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{ report_id: string; content: string; title: string } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("last_upload_id");
    if (id) setUploadId(id);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await reportApi.list();
      setReports(res.data.reports);
    } catch {
      // silent
    }
  };

  const handleGenerate = async () => {
    if (!uploadId) {
      toast.error("Please upload a dataset first (go to Upload page)");
      return;
    }
    setGenerating(true);
    try {
      const res = await reportApi.generate({ upload_id: uploadId, title, org_name: orgName, period, tone });
      setGeneratedReport(res.data);
      toast.success("Report generated successfully!");
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Report generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string, reportTitle: string) => {
    setDownloadingId(reportId);
    try {
      const res = await reportApi.download(reportId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, "_")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-3xl text-white mb-1">AI Report Generator</h1>
          <p className="text-slate-400 text-sm">Gemini AI writes a full 8-section donor report from your data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Generate form ───────────────────────────────── */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" /> Report Configuration
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Report Title</label>
                <input id="report-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Organisation Name
                </label>
                <input id="report-org" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Seva Foundation" className="input-dark" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Reporting Period
                </label>
                <input id="report-period" type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. Q1 2024" className="input-dark" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
                  Report Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setTone("formal")} 
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${tone === "formal" ? "bg-primary-500/10 border-primary-500 text-primary-400" : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    Formal
                  </button>
                  <button 
                    onClick={() => setTone("concise")} 
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${tone === "concise" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    Concise
                  </button>
                  <button 
                    onClick={() => setTone("storyline")} 
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${tone === "storyline" ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-500"}`}
                  >
                    Storyline
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {tone === "formal" && "Detailed and technical report for institutional donors."}
                  {tone === "concise" && "Short, straight-to-the-point summary of key metrics."}
                  {tone === "storyline" && "Narrative-driven impact story for the general public."}
                </p>
              </div>
            </div>

            {!uploadId && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400">
                ⚠ No dataset uploaded. Go to Upload page first.
              </div>
            )}

            <button
              id="btn-generate-report"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full justify-center py-3.5 mt-5"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? "Writing report with Gemini AI…" : "Generate Report"}
            </button>
          </div>

          {/* ── Generated content preview ────────────────────── */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            {generatedReport ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm">{generatedReport.title}</h3>
                  <button
                    id="btn-download-new"
                    onClick={() => handleDownload(generatedReport.report_id, generatedReport.title)}
                    disabled={downloadingId === generatedReport.report_id}
                    className="btn-emerald px-4 py-2 text-xs"
                  >
                    {downloadingId === generatedReport.report_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Download PDF
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className={`text-xs text-slate-300 leading-6 whitespace-pre-wrap ${!expanded ? "max-h-96 overflow-hidden" : ""}`}>
                    {generatedReport.content}
                  </div>
                  {!expanded && (
                    <div className="h-12 bg-gradient-to-t from-surface to-transparent -mt-12 relative" />
                  )}
                </div>

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-2 self-center"
                >
                  {expanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Read full report</>}
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-primary-400" />
                  </div>
                  <p className="text-slate-400 text-sm">Your AI-generated report will appear here</p>
                  <p className="text-slate-600 text-xs mt-1">Sections: Executive Summary · KPIs · Achievements · Challenges · Recommendations</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Past Reports ─────────────────────────────────────── */}
        {reports.length > 0 && (
          <div className="mt-8 glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Past Reports</h2>
            <div className="flex flex-col gap-3">
              {reports.map((r) => (
                <div key={r.report_id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      {r.org_name && <span>· {r.org_name}</span>}
                      {r.period && <span>· {r.period}</span>}
                    </p>
                  </div>
                  <button
                    id={`btn-dl-${r.report_id}`}
                    onClick={() => handleDownload(r.report_id, r.title)}
                    disabled={downloadingId === r.report_id}
                    className="btn-secondary px-3 py-1.5 text-xs flex-shrink-0"
                  >
                    {downloadingId === r.report_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
