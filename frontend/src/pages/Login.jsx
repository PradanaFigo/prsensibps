import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { username, password });
      
      const token = res.data.access_token;
      localStorage.setItem("access_token", token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("nama", res.data.nama);
      
      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Username atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "var(--bg-color)", /* Cream background */
      padding: "20px" 
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "400px", 
        backgroundColor: "white", 
        borderRadius: "var(--radius-lg)", 
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden", 
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Top Half (Dark Menu Admin Color) */}
        <div style={{ 
          backgroundColor: "#1e2a38", 
          padding: "36px 32px 24px 32px",
          textAlign: "center"
        }}>
          <img src="/bps-logo.png" alt="BPS Logo" style={{ height: "56px", margin: "0 auto 16px auto", display: "block", objectFit: "contain" }} />
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "white", marginBottom: "4px", letterSpacing: "-0.5px" }}>Presensi Magang</h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>Badan Pusat Statistik Jakarta Utara</p>
        </div>

        {/* Bottom Half (White Login Form) */}
        <div style={{ 
          padding: "32px",
          backgroundColor: "white"
        }}>
          <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
            {error && (
              <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #f87171", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Username</label>
              <input
                type="text"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: "100%", padding: "12px 16px", fontSize: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "var(--text-main)", outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-blue)"}
                onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
              />
            </div>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "12px 16px", fontSize: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "var(--text-main)", outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-blue)"}
                onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
              />
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                <input 
                  type="checkbox" 
                  id="showPwd" 
                  checked={showPassword} 
                  onChange={(e) => setShowPassword(e.target.checked)} 
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary-blue)" }}
                />
                <label htmlFor="showPwd" style={{ cursor: "pointer", userSelect: "none" }}>Tampilkan Password</label>
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "15px", marginTop: "8px", borderRadius: "8px" }} disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
