"use client";
import { AppShell } from "@/components/AppShell";
import { Settings, User, Building2, Palette, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-3xl text-white mb-1">Settings</h1>
          <p className="text-slate-400 text-sm">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Profile */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" /> Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
                <input id="settings-name" type="text" placeholder="Your name" className="input-dark" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
                <input id="settings-email" type="email" placeholder="you@ngo.org" className="input-dark" />
              </div>
            </div>
          </div>

          {/* Organisation */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald" /> Organisation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">NGO Name</label>
                <input id="settings-org" type="text" placeholder="e.g. Seva Foundation" className="input-dark" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Registration Number</label>
                <input id="settings-reg" type="text" placeholder="e.g. NGO/2023/12345" className="input-dark" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Mission Statement</label>
                <textarea id="settings-mission" rows={3} placeholder="Describe your NGO's mission…" className="input-dark resize-none" />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" /> Appearance
            </h2>
            <div className="flex gap-3">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  id={`theme-${t}`}
                  onClick={() => setTheme(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                    theme === t ? "bg-primary-500/20 text-white border border-primary-500/40" : "text-slate-400 bg-white/5 hover:text-white"
                  }`}
                >
                  {t} Mode
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">Light mode coming soon. Dark mode is the default premium experience.</p>
          </div>

          {/* Notifications */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Notifications
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Report Generation Alerts</p>
                <p className="text-xs text-slate-400 mt-0.5">Get notified when your report is ready</p>
              </div>
              <button
                id="toggle-notifications"
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-all relative ${notifications ? "bg-primary-500" : "bg-surface"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifications ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" /> Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Current Password</label>
                <input id="settings-cur-pwd" type="password" placeholder="••••••••" className="input-dark" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">New Password</label>
                <input id="settings-new-pwd" type="password" placeholder="••••••••" className="input-dark" />
              </div>
            </div>
          </div>

          <button
            id="btn-save-settings"
            onClick={() => toast.success("Settings saved!")}
            className="btn-primary py-3 justify-center"
          >
            <Settings className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </AppShell>
  );
}
