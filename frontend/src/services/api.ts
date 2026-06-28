import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("impactlens_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("impactlens_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Typed API helpers ────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string; organization?: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

export const uploadApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/api/upload/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => e,
    });
  },
};

export const dashboardApi = {
  kpis: (uploadId: string) => api.get(`/api/dashboard/kpis?upload_id=${uploadId}`),
};

export const analyticsApi = {
  predict: (data: Record<string, number>) => api.post("/api/analytics/predict", data),
  sentiment: (texts: string[]) => api.post("/api/analytics/sentiment", { texts }),
};

export const reportApi = {
  generate: (data: { upload_id: string; title?: string; org_name?: string; period?: string }) =>
    api.post("/api/report/generate", data),
  list: () => api.get("/api/report/list"),
  download: (reportId: string) =>
    api.get(`/api/report/download/${reportId}`, { responseType: "blob" }),
};
