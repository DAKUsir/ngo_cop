"use client";
import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { uploadApi } from "@/services/api";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  Loader2, X, Eye, ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UploadResult {
  upload_id: string;
  filename: string;
  rows: number;
  columns: string[];
  validation_issues: { type: string; message: string; count?: number }[];
  cleaning_summary: { duplicates_removed: number; missing_filled: number; null_rows_removed: number };
  preview: Record<string, any>[];
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 15 : p));
    }, 300);

    try {
      const res = await uploadApi.upload(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(res.data);
      localStorage.setItem("last_upload_id", res.data.upload_id);
      toast.success(`Uploaded ${res.data.rows} rows successfully!`);
    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.response?.data?.detail ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-3xl text-white mb-1">Upload Dataset</h1>
          <p className="text-slate-400 text-sm">Supports CSV, Excel (.xlsx, .xls) up to 10 MB</p>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          id="drop-zone"
          className={`glass rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive ? "border-primary-500 bg-primary-500/10 shadow-glow-sm" : "hover:border-primary-500/50 hover:bg-white/2"
          }`}
        >
          <input {...getInputProps()} id="file-input" />
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Upload className={`w-8 h-8 ${isDragActive ? "text-primary-400 animate-bounce" : "text-primary-500"}`} />
          </div>
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald" />
              <span className="text-white font-medium">{file.name}</span>
              <span className="text-slate-400 text-sm">({(file.size / 1024).toFixed(0)} KB)</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="text-slate-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : isDragActive ? (
            <p className="text-primary-300 font-medium">Drop your file here…</p>
          ) : (
            <>
              <p className="text-white font-medium mb-1">Drag & drop your file here</p>
              <p className="text-slate-400 text-sm">or click to browse</p>
            </>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Uploading & processing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-emerald transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        {file && !uploading && !result && (
          <button
            id="btn-upload"
            onClick={handleUpload}
            className="btn-primary mt-4 w-full justify-center py-3.5"
          >
            <Upload className="w-4 h-4" /> Process & Upload
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 flex flex-col gap-5 animate-fade-in">
            {/* Summary */}
            <div className="glass rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald" /> Processing Complete
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Rows", value: result.rows },
                  { label: "Columns", value: result.columns.length },
                  { label: "Duplicates Removed", value: result.cleaning_summary.duplicates_removed },
                  { label: "Missing Filled", value: result.cleaning_summary.missing_filled },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-2xl font-display font-700 gradient-text">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation issues */}
            {result.validation_issues.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Validation Issues ({result.validation_issues.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {result.validation_issues.map((issue, i) => (
                    <div key={i} className="text-xs text-slate-400 bg-white/5 rounded-lg px-3 py-2">
                      ⚠ {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-400" /> Data Preview (first 5 rows)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-400">
                  <thead>
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col} className="text-left py-2 px-3 bg-white/5 first:rounded-l-lg last:rounded-r-lg text-slate-300 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} className="border-t border-white/5">
                        {result.columns.map((col) => (
                          <td key={col} className="py-2 px-3">{String(row[col] ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button
                id="btn-view-dashboard"
                onClick={() => router.push("/dashboard")}
                className="btn-primary flex-1 justify-center py-3"
              >
                View Dashboard <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id="btn-go-report"
                onClick={() => router.push("/report")}
                className="btn-emerald flex-1 justify-center py-3"
              >
                Generate AI Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
