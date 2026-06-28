"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { BarChart3, Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, Loader2, Zap } from "lucide-react";
import { authApi } from "@/services/api";
import Link from "next/link";
import { Suspense } from "react";
import api from "@/services/api";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  name: string;
  organization?: string;
  confirmPassword: string;
}

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get("mode") === "register");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      Cookies.set("impactlens_token", res.data.access_token, { expires: 3 });
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        organization: data.organization,
      });
      Cookies.set("impactlens_token", res.data.access_token, { expires: 3 });
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await api.post("/api/auth/demo");
      Cookies.set("impactlens_token", res.data.access_token, { expires: 3 });
      toast.success("Welcome to the Demo! 🚀");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Demo login failed — is the backend running?");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex overflow-hidden">
      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="orb orb-purple w-96 h-96 top-0 left-0 opacity-20" />
        <div className="orb orb-emerald w-72 h-72 bottom-0 right-0 opacity-15" />

        <Link href="/" className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-emerald flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-700 text-xl text-white">Impact<span className="gradient-text">Lens</span></span>
        </Link>

        <div className="relative">
          <h2 className="font-display font-800 text-5xl text-white mb-6 leading-tight">
            Automate Your<br />
            <span className="gradient-text">NGO Impact Reports</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-md">
            Upload your beneficiary data and let AI generate professional donor reports with ML predictions,
            sentiment analysis, and PDF export — all in minutes.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "AI-powered executive summaries",
              "Random Forest impact classification",
              "Automatic KPI extraction",
              "One-click PDF download",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald/20 border border-emerald/40 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-emerald" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} ImpactLens · AI NGO Reporting Platform
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────── */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-emerald flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-white">ImpactLens</span>
          </Link>

          {/* ── Demo skip button ─────────────────────────── */}
          <button
            id="btn-demo"
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 mb-5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
              boxShadow: "0 0 24px rgba(16,185,129,0.35)",
              border: "1px solid rgba(16,185,129,0.5)",
            }}
          >
            {demoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-white" />
            )}
            {demoLoading ? "Loading Demo…" : "Skip — Enter as Demo User"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or sign in with your account</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tab toggle */}
          <div className="glass rounded-2xl p-1 flex mb-6">
            <button
              id="tab-login"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                !isRegister ? "bg-primary-500/20 text-white border border-primary-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isRegister ? "bg-primary-500/20 text-white border border-primary-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {!isRegister ? (
            /* ── Login form ──────────────────────────────────── */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@ngo.org"
                    className="input-dark pl-10"
                    {...loginForm.register("email", { required: true })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-dark pl-10 pr-10"
                    {...loginForm.register("password", { required: true })}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button id="btn-login" type="submit" disabled={loading} className="btn-primary justify-center py-3.5 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            /* ── Register form ───────────────────────────────── */
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="reg-name" type="text" placeholder="John Doe" className="input-dark pl-10"
                    {...registerForm.register("name", { required: true })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="reg-email" type="email" placeholder="you@ngo.org" className="input-dark pl-10"
                    {...registerForm.register("email", { required: true })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Organisation (optional)</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="reg-org" type="text" placeholder="Your NGO Name" className="input-dark pl-10"
                    {...registerForm.register("organization")} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="reg-password" type={showPwd ? "text" : "password"} placeholder="••••••••" className="input-dark pl-10 pr-10"
                    {...registerForm.register("password", { required: true, minLength: 6 })} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="reg-confirm" type={showPwd ? "text" : "password"} placeholder="••••••••" className="input-dark pl-10"
                    {...registerForm.register("confirmPassword", { required: true })} />
                </div>
              </div>
              <button id="btn-register" type="submit" disabled={loading} className="btn-primary justify-center py-3.5 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 mt-6">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
