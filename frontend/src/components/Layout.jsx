import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileCheck, History, LogOut, Settings, CalendarCheck, Menu, X, KeyRound } from "lucide-react";
import apiClient from "../api/client.js";

export default function Layout({ children, title, role, userName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const actualName = localStorage.getItem("nama") || userName;

  // State Ganti Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ old_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [showPwdModal1, setShowPwdModal1] = useState(false);
  const [showPwdModal2, setShowPwdModal2] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("nama");
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setIsSavingPwd(true);
    try {
      await apiClient.put("/auth/change-password", pwdData);
      alert("Password berhasil diubah!");
      setShowPasswordModal(false);
      setPwdData({ old_password: "", new_password: "" });
    } catch (err) {
      setPwdMsg(err.response?.data?.detail || "Gagal mengubah password");
    } finally {
      setIsSavingPwd(false);
    }
  };

  const adminLinks = [
    { path: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/admin/attendance", label: "Data Presensi", icon: <CalendarCheck size={20} /> },
    { path: "/admin/logbook", label: "Logbook", icon: <BookOpen size={20} /> },
    { path: "/admin/leaves", label: "Persetujuan Izin", icon: <FileCheck size={20} /> },
    { path: "/admin/settings", label: "Pengaturan", icon: <Settings size={20} /> },
  ];

  const userLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/logbook", label: "Logbook", icon: <BookOpen size={20} /> },
    { path: "/leaves", label: "Izin & Sakit", icon: <FileCheck size={20} /> },
    { path: "/history", label: "Riwayat", icon: <History size={20} /> },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <div className="layout-container">
      {/* Modal Ganti Password Global */}
      {showPasswordModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, 
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "16px"
        }}>
          <div className="card" style={{ maxWidth: "400px", width: "100%", margin: "0 auto", animation: "slideUp 0.3s ease-out", boxSizing: "border-box" }}>
            <h3 style={{ marginBottom: 16 }}>Ganti Password</h3>
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Password Lama</label>
                <input
                  type={showPwdModal1 ? "text" : "password"}
                  className="input-field"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={pwdData.old_password}
                  onChange={(e) => setPwdData({ ...pwdData, old_password: e.target.value })}
                  required
                />
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <input type="checkbox" id="showPwd1" checked={showPwdModal1} onChange={(e) => setShowPwdModal1(e.target.checked)} />
                  <label htmlFor="showPwd1" style={{ cursor: "pointer" }}>Tampilkan</label>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Password Baru</label>
                <input
                  type={showPwdModal2 ? "text" : "password"}
                  className="input-field"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={pwdData.new_password}
                  onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                  required
                />
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <input type="checkbox" id="showPwd2" checked={showPwdModal2} onChange={(e) => setShowPwdModal2(e.target.checked)} />
                  <label htmlFor="showPwd2" style={{ cursor: "pointer" }}>Tampilkan</label>
                </div>
              </div>
              {pwdMsg && <div className="error-message" style={{ marginBottom: "16px" }}>{pwdMsg}</div>}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" style={{ padding: "10px 20px" }} onClick={() => setShowPasswordModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 20px", width: "auto" }} disabled={isSavingPwd}>
                  {isSavingPwd ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar-light ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ background: "transparent", padding: 0 }}>
            <img src="/bps-logo.png" alt="BPS Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <div className="sidebar-title">Presensi Magang</div>
              <div className="sidebar-subtitle" style={{ fontSize: "12px", color: "var(--text-muted)" }}>BPS Jakarta Utara</div>
            </div>
            {/* Close button inside sidebar on mobile */}
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(false)} style={{ color: "white", padding: 0, margin: 0 }}>
              <X size={24} />
            </button>
          </div>
        </div>

        <ul className="nav-menu">
          {links.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        
        <div style={{ padding: "0" }}>
          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowPasswordModal(true);
            }}
            className="nav-link"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer" }}
          >
            <KeyRound size={20} />
            Ganti Password
          </button>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer" }}
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="top-navbar-title" style={{ margin: 0, fontWeight: 700, fontSize: "18px" }}>{title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="avatar" style={{ backgroundColor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", borderRadius: "50%", width: "36px", height: "36px", fontSize: "14px" }}>
              {actualName.substring(0,2).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>{actualName.split(' ')[0]}</span>
          </div>
        </header>

        <main style={{ padding: "24px 40px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} className="dashboard-main-content">
          <style>{`
            @media (max-width: 768px) {
              .dashboard-main-content { padding: 16px !important; }
            }
          `}</style>
          <div style={{ marginBottom: "24px", color: "var(--text-main)", fontSize: "20px", fontWeight: 600 }}>
            Selamat datang, {actualName}!
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
