"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { authApi } from "@/services/api";
import {
  BarChart3, LayoutDashboard, Upload, FileText,
  Brain, Settings, LogOut, Menu, X, ChevronRight,
  Sun, Moon
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard",  icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/upload",    label: "Upload Data", icon: <Upload className="w-4 h-4" /> },
  { href: "/analytics", label: "Analytics",   icon: <Brain className="w-4 h-4" /> },
  { href: "/report",    label: "Reports",     icon: <FileText className="w-4 h-4" /> },
  { href: "/settings",  label: "Settings",    icon: <Settings className="w-4 h-4" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; organization?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load user
  const loadUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      Cookies.remove("impactlens_token");
      router.push("/login");
    }
  }, [router]);

  // Load theme from localStorage
  useEffect(() => {
    loadUser();
    const savedTheme = localStorage.getItem("impactlens_theme") as "dark" | "light";
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    }
  }, [loadUser]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("impactlens_theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const logout = () => {
    Cookies.remove("impactlens_token");
    router.push("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? "fixed inset-y-0 left-0 z-50 w-64" : "w-64 hidden lg:flex"} flex flex-col h-screen glass border-r border-sidebar`}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-emerald flex items-center justify-center shadow-lg">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-700 text-lg">Impact<span className="gradient-text">Lens</span></span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-primary-500/10 text-primary-500 border border-primary-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]"
              }`}
            >
              <span className={active ? "text-primary-500" : ""}>{item.icon}</span>
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-sidebar">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-emerald flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[var(--text-main)]">{user.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.organization ?? user.email}</p>
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-body)]">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <Sidebar mobile />
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 glass border-b border-sidebar flex items-center px-6 gap-4 flex-shrink-0 z-10">
          <button
            id="btn-menu"
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-main)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--border-color)]">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-xs font-medium text-[var(--text-muted)]">API Connected</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
