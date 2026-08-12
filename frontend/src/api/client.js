import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// Selipkan token JWT ke setiap request jika ada
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Kalau token expired/invalid, arahkan balik ke halaman login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("nama");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
