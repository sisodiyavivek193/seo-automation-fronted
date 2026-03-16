import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://seo-automation-production-bfb4.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
});

// REQUEST LOG
api.interceptors.request.use((config) => {
  console.log("🚀 API Request:", config.method?.toUpperCase(), config.url);
  console.log("📦 Payload:", config.data);

  const user = localStorage.getItem("seo_auth");
  if (user) {
    const parsed = JSON.parse(user);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
      console.log("🔑 Token attached");
    }
  }

  return config;
});

// RESPONSE LOG
api.interceptors.response.use(
  (res) => {
    console.log("✅ API Response:", res.data);
    return res;
  },
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log("⚠️ Unauthorized - redirecting to login");
      localStorage.removeItem("seo_auth");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");

// Clients
export const getClients = () => api.get("/clients");
export const getClientById = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post("/clients", data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Reports
export const getReports = (params = {}) => api.get("/reports", { params });
export const getReportsByClient = (id) => api.get(`/reports/client/${id}`);
export const createReport = (data) => api.post("/reports", data);
export const deleteReport = (id) => api.delete(`/reports/${id}`);
export const getReportStats = () => api.get("/reports/stats");

export const downloadReportUrl = (id) =>
  `https://seo-automation-production-bfb4.up.railway.app/api/reports/${id}/download`;

export default api;
