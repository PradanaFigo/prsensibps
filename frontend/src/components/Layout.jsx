import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileCheck, History, LogOut, Bell, Search, Sun, Settings, CalendarCheck, Menu, X } from "lucide-react";

export default function Layout({ children, title, role, userName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const actualName = localStorage.getItem("nama") || userName;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("nama");
    navigate("/login");
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
