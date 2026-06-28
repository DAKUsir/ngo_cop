"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { dashboardApi } from "@/services/api";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from "recharts";
import {
  Users, IndianRupee, TrendingUp, MapPin, Star, Briefcase,
  Upload, RefreshCw, AlertCircle, Calendar, Activity, BookOpen
} from "lucide-react";
import Link from "next/link";

const COLORS = ["#6C63FF", "#10B981", "#06B6D4", "#F59E0B", "#EC4899"];

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] mb-0.5">{label}</p>
        <p className="text-2xl font-display font-700 text-[var(--text-main)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton h-24 rounded-2xl" />;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [uploadId, setUploadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("last_upload_id");
    if (id) {
      setUploadId(id);
      fetchKpis(id);
    }
  }, []);

  const fetchKpis = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardApi.kpis(id);
      setKpis(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-700 text-3xl text-[var(--text-main)] mb-1">Impact Overview</h1>
            <p className="text-[var(--text-muted)] text-sm">Visualising the real-world difference your programme is making.</p>
          </div>
          <div className="flex gap-3">
            {uploadId && (
              <button
                id="btn-refresh"
                onClick={() => fetchKpis(uploadId)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </button>
            )}
            <Link href="/upload" className="btn-primary px-4 py-2 text-sm">
              <Upload className="w-4 h-4" /> Upload Dataset
            </Link>
          </div>
        </div>

        {!uploadId ? (
          /* Empty state */
          <div className="glass rounded-2xl p-16 text-center mt-8">
            <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(108,99,255,0.2)]">
              <Activity className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">Your Dashboard is Empty</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto leading-relaxed">
              Upload your NGO field dataset (CSV or Excel) to instantly generate interactive KPIs, regional charts, and AI-driven insights.
            </p>
            <Link href="/upload" className="btn-primary px-8 py-3 shadow-lg">
              Upload Your First Dataset
            </Link>
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-10 text-center mt-8 border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={() => fetchKpis(uploadId)} className="btn-secondary mt-6">Retry Connection</button>
          </div>
        ) : (
          <>
            {/* 1. The Big Picture (KPIs) */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                <TargetIcon /> The Big Picture
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : kpis ? (
                  <>
                    <StatCard icon={<Users className="w-5 h-5 text-primary-500" />} label="Lives Impacted" value={kpis.total_beneficiaries?.toLocaleString()} sub={`Across ${kpis.projects_count} sites`} color="bg-primary-500/10 border border-primary-500/20" />
                    <StatCard icon={<IndianRupee className="w-5 h-5 text-emerald-500" />} label="Funds Utilised" value={`₹${(kpis.total_funds / 1_00_000).toFixed(1)}L`} sub={`₹${kpis.cost_per_beneficiary?.toFixed(0)} per person`} color="bg-emerald-500/10 border border-emerald-500/20" />
                    <StatCard icon={<TrendingUp className="w-5 h-5 text-cyan-500" />} label="Growth Rate" value={`${kpis.monthly_growth}%`} sub="Month over Month" color="bg-cyan-500/10 border border-cyan-500/20" />
                    <StatCard icon={<Star className="w-5 h-5 text-amber-500" />} label="Community Feedback" value={`${kpis.feedback_score?.toFixed(1)} / 5`} sub="Average satisfaction" color="bg-amber-500/10 border border-amber-500/20" />
                  </>
                ) : null}
              </div>
            </section>

            {/* 2. Growth & Engagement (Trends) */}
            {kpis && (
              <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" /> Growth & Engagement Over Time
                </h2>
                <div className="glass rounded-3xl p-6">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--text-main)]">Beneficiary Reach vs Resource Allocation</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Tracking how funds directly correlate to lives impacted over the reporting months.</p>
                    </div>
                    <div className="flex gap-4 mt-3 sm:mt-0 text-sm">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-500" /> Beneficiaries</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Funds (₹)</div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={kpis.line_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          cursor={{ stroke: 'var(--border-color)', strokeWidth: 2, strokeDasharray: '4 4' }}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--glass-shadow)' }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="beneficiaries" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorBen)" />
                        <Line yAxisId="right" type="monotone" dataKey="funds" stroke="#10B981" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: "var(--bg-glass)" }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Geographical Reach & Demographics */}
            {kpis && (
              <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" /> Geographical Reach & Demographics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Regional Breakdown */}
                  <div className="glass rounded-3xl p-6 lg:col-span-2 flex flex-col">
                    <h3 className="font-semibold text-[var(--text-main)] mb-1">Impact by Location</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6">Top performing intervention sites by beneficiary count.</p>
                    <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kpis.bar_chart?.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} dx={-10} fontWeight={500} />
                          <Tooltip 
                            cursor={{ fill: 'var(--border-color)', opacity: 0.4 }} 
                            contentStyle={{ borderRadius: 12, border: 'none' }}
                          />
                          <Bar dataKey="beneficiaries" fill="#10B981" radius={[0, 6, 6, 0]} barSize={24}>
                            {
                              kpis.bar_chart?.slice(0, 7).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#6C63FF' : '#10B981'} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Demographic Split */}
                  <div className="glass rounded-3xl p-6 flex flex-col">
                    <h3 className="font-semibold text-[var(--text-main)] mb-1">Who We Serve</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6">Demographic breakdown across all sites.</p>
                    <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={kpis.pie_chart} 
                            cx="50%" cy="50%" 
                            innerRadius={70} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                            stroke="none"
                          >
                            {kpis.pie_chart?.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} formatter={(val: number) => `${val}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-[var(--text-main)]">{kpis.women_percentage?.toFixed(0)}%</span>
                        <span className="text-xs text-[var(--text-muted)]">Women</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {kpis.pie_chart?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
