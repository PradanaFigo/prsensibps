import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, FileCheck, History, LogOut, Bell, Search, Sun, Settings, CalendarCheck } from "lucide-react";

export default function Layout({ children, title, role, userName }) {
  const location = useLocation();
  const navigate = useNavigate();
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
      <aside className="sidebar-light">
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ background: "transparent", padding: 0 }}>
            <img src="/bps-logo.png" alt="BPS Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div className="sidebar-title">Presensi Magang</div>
            <div className="sidebar-subtitle" style={{ fontSize: "12px", color: "var(--text-muted)" }}>BPS Jakarta Utara</div>
          </div>
        </div>

        <ul className="nav-menu">
          {links.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        
        <div style={{ padding: "0" }}>
          <button 
            className="nav-link" 
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-navbar">
          <h1 className="top-navbar-title">{title}</h1>
          
          <div className="top-navbar-right">
            <div className="user-profile">
              <div className="user-avatar">
                {actualName.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-name">
                {actualName}
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div style={{ marginBottom: "24px", color: "var(--text-main)", fontSize: "20px", fontWeight: 600 }}>
            Selamat datang, {actualName}!
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
