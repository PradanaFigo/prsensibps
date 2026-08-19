import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, UserCheck, Clock, UserX, Check, X, UserMinus } from "lucide-react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

const radiusTop = (x, y, width, height) => `M${x},${y + height} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + width - 4},${y} Q${x + width},${y} ${x + width},${y + 4} L${x + width},${y + height} Z`;
const flatRect = (x, y, width, height) => `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter((item) => item.value > 0);
    if (filteredPayload.length === 0) return null;
    return (
      <div style={{ backgroundColor: "#ffffff", padding: "10px 14px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", marginBottom: "6px", fontSize: "13px" }}>{label}</p>
        {filteredPayload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: "3px 0", color: entry.fill || entry.color, fontSize: "12px", fontWeight: 600 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || data.value === 0) return null;
    return (
      <div style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" }}>
        <p style={{ margin: 0, color: data.payload?.color || data.color, fontSize: "12px", fontWeight: 600 }}>
          {data.name}: {data.value}
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_peserta: 0,
    hadir_hari_ini: 0,
    izin_hari_ini: 0,
    alpa_hari_ini: 0,
    weekly_data: [],
    composition_data: []
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ nama: "", username: "", role: "user" });
  const [userMsg, setUserMsg] = useState("");
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  const [rekapRange, setRekapRange] = useState({ tanggal_awal: null, tanggal_akhir: null });
  const [rekapRows, setRekapRows] = useState([]);
  const [rekapMsg, setRekapMsg] = useState("");
  
  const [pendingLeaves, setPendingLeaves] = useState([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ old_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [showPwdModal1, setShowPwdModal1] = useState(false);
  const [showPwdModal2, setShowPwdModal2] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    try {
      await apiClient.put("/auth/change-password", pwdData);
      alert("Password berhasil diubah!");
      setShowPasswordModal(false);
      setPwdData({ old_password: "", new_password: "" });
    } catch (err) {
      setPwdMsg(err.response?.data?.detail || "Gagal mengubah password");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      setUsers(res.data);
    } catch {
      setUserMsg("Gagal memuat daftar akun");
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get("/stats/admin");
        setStats(res.data);
      } catch (err) {
        console.error("Gagal memuat statistik", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchLeaves = () => {
      apiClient.get("/leave").then(res => {
        if(Array.isArray(res.data)) {
          setPendingLeaves(res.data.filter(l => (l.status_approval || "pending") === "pending").slice(0, 4));
        }
      }).catch(() => {});
    };

    fetchStats();
    loadUsers();
    fetchLeaves();

    const interval = setInterval(() => {
      fetchStats();
      fetchLeaves();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserMsg("");
    try {
      const res = await apiClient.post("/users", form);
      setUserMsg(`Akun ${form.nama} berhasil dibuat.`);
      setForm({ nama: "", username: "", role: "user" });
      loadUsers();
      if (res.data.temp_password) {
        setGeneratedCreds({
          title: "Akun Baru Berhasil Dibuat",
          nama: res.data.nama,
          username: res.data.username,
          password: res.data.temp_password
        });
      }
    } catch (err) {
      setUserMsg(err.response?.data?.detail || "Gagal membuat akun");
    }
  };

  const handleProcessLeave = async (id, status) => {
    try {
      await apiClient.put(`/leave/${id}/approve`, { status });
      // Refresh pending leaves
      apiClient.get("/leave").then(res => {
        if(Array.isArray(res.data)) {
          setPendingLeaves(res.data.filter(l => (l.status_approval || "pending") === "pending").slice(0, 4));
        }
      }).catch(() => {});
    } catch (err) {
      alert("Gagal memproses izin");
    }
  };

  const handleDeleteUser = async (id, nama) => {
    if (!window.confirm(`Yakin hapus akun ${nama}? Data histori tetap tersimpan.`)) return;
    try {
      await apiClient.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghapus akun");
    }
  };

  const handleResetPassword = async (id, nama) => {
    if (!window.confirm(`Yakin reset password untuk akun ${nama}?`)) return;
    try {
      const res = await apiClient.post(`/users/${id}/reset-password`);
      if (res.data.temp_password) {
        setGeneratedCreds({
          title: "Password Berhasil Direset",
          nama: res.data.nama,
          username: res.data.username,
          password: res.data.temp_password
        });
      } else {
        alert("Password berhasil direset, silakan cek email.");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal mereset password");
    }
  };

  const handleLoadRekap = async (e) => {
    e.preventDefault();
    setRekapMsg("");
    
    const params = {};
    if (rekapRange.tanggal_awal) {
      params.tanggal_awal = new Date(rekapRange.tanggal_awal.getTime() - rekapRange.tanggal_awal.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    }
    if (rekapRange.tanggal_akhir) {
      params.tanggal_akhir = new Date(rekapRange.tanggal_akhir.getTime() - rekapRange.tanggal_akhir.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    }
    
    try {
      const res = await apiClient.get("/recap", { params });
      setRekapRows(res.data);
    } catch (err) {
      setRekapMsg(err.response?.data?.detail || "Gagal memuat rekap");
    }
  };

  const handleExportExcel = async () => {
    if (!rekapRange.tanggal_awal || !rekapRange.tanggal_akhir) {
      alert("Pilih tanggal awal dan akhir terlebih dahulu");
      return;
    }
    try {
      const params = {};
      if (rekapRange.tanggal_awal) {
        params.tanggal_awal = new Date(rekapRange.tanggal_awal.getTime() - rekapRange.tanggal_awal.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      }
      if (rekapRange.tanggal_akhir) {
        params.tanggal_akhir = new Date(rekapRange.tanggal_akhir.getTime() - rekapRange.tanggal_akhir.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      }
      
      const res = await apiClient.get("/recap/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rekap_absensi_${params.tanggal_awal}_${params.tanggal_akhir}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Gagal mengunduh Excel");
    }
  };

  if (loading) {
    return <Layout title="Dashboard" role="admin"><div style={{ padding: "20px" }}>Memuat statistik...</div></Layout>;
  }

  return (
    <Layout title="Dashboard" role="admin">
      {generatedCreds && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, 
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div className="card" style={{ maxWidth: "400px", width: "90%", margin: "0 auto", animation: "slideUp 0.3s ease-out" }}>
            <h3 style={{ color: "#16a34a", marginBottom: 16 }}>{generatedCreds.title}</h3>
            <p style={{ marginBottom: 16, fontSize: 14 }}>
              Silakan copy informasi login di bawah ini dan berikan kepada <b>{generatedCreds.nama}</b> secara manual.
            </p>
            <div style={{ backgroundColor: "#f1f5f9", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ marginBottom: "8px" }}><strong>Username:</strong> {generatedCreds.username}</div>
              <div><strong>Password:</strong> <span style={{ fontFamily: "monospace", fontSize: "16px", letterSpacing: "1px", backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>{generatedCreds.password}</span></div>
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setGeneratedCreds(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ADMIN BANNER */}
      <div className="location-card-content" style={{ backgroundColor: "#fef3c7", color: "var(--primary-blue)", padding: "24px 32px", borderRadius: "var(--radius-md)", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Administrator Dashboard</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "14px" }}>Kelola semua data presensi dan akun pengguna</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid-cards">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-title">Peserta Magang Aktif</div>
            <div className="stat-value">{stats.total_peserta}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-title">Hadir Hari Ini</div>
            <div className="stat-value">{stats.hadir_hari_ini + (stats.telat_hari_ini || 0)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <UserMinus size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-title">Izin/Sakit Hari Ini</div>
            <div className="stat-value">{stats.izin_hari_ini}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-title">Alpa Hari Ini</div>
            <div className="stat-value">{stats.alpa_hari_ini}</div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid" style={{ marginBottom: "24px" }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: "24px" }}>Kehadiran Mingguan</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekly_data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }} maxBarSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} domain={[0, 'dataMax']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '12px', width: '100%', display: 'flex', justifyContent: 'center' }} />
                <Bar dataKey="hadir" name="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="telat" name="Telat" fill="#c28f32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpa" name="Alpa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="izin" name="Izin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: "24px" }}>Komposisi Kehadiran (Bulan Ini)</h3>
          <div style={{ height: "300px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={stats.composition_data.filter(item => item.value > 0)} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.composition_data.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap', width: '100%' }}>
              {stats.composition_data.filter(item => item.value > 0).map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  {item.name}: {item.value}
                </div>
              ))}
              {stats.composition_data.every(item => item.value === 0) && (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Belum ada data kehadiran bulan ini</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="dashboard-grid">
        {/* Manajemen Akun */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Manajemen Akun</h3>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Kelola akun admin dan peserta magang</p>
          
          <form onSubmit={handleCreateUser} className="form-grid" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Nama Lengkap</label>
              <input
                placeholder="Nama Lengkap"
                className="input-field"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Username</label>
              <input
                placeholder="Username"
                type="text"
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Role</label>
              <Select
                value={{ value: form.role, label: form.role === 'admin' ? 'Admin' : 'User' }}
                onChange={(selected) => setForm({ ...form, role: selected.value })}
                options={[
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: "48px" }}>Tambah Akun</button>
          </form>
          {userMsg && <div className="error-message" style={{ marginBottom: "20px" }}>{userMsg}</div>}

          <div className="table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Nama</th>
                  <th style={{ width: "25%" }}>Username</th>
                  <th style={{ width: "20%" }}>Role</th>
                  <th style={{ width: "25%", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>
                          {u.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ whiteSpace: "nowrap" }}>{u.nama}</span>
                      </div>
                    </td>
                    <td>{u.username}</td>
                    <td>{u.role === "admin" ? "Admin" : "User"}</td>
                    <td style={{ textAlign: "right" }}>
                      {!u.is_deleted && (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="btn-soft-warning" onClick={() => handleResetPassword(u.id, u.nama)}>Reset</button>
                          <button className="btn-soft-danger" onClick={() => handleDeleteUser(u.id, u.nama)}>Hapus</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval requests */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>Persetujuan Izin/Sakit</h3>
            <Link to="/admin/leaves" style={{ fontSize: "14px", color: "var(--primary-blue)", textDecoration: "none" }}>Lihat semua</Link>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pendingLeaves.length > 0 ? pendingLeaves.map(leave => (
              <div key={leave.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                    {users.find(u => u.id === leave.user_id)?.nama || "User Tidak Diketahui"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {leave.jenis} • {leave.keterangan || 'Tidak ada keterangan'}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {new Date(leave.tanggal).toLocaleDateString("id-ID")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="action-icon-btn reject" onClick={() => handleProcessLeave(leave.id, "ditolak")}><X size={16} /></button>
                  <button className="action-icon-btn approve" onClick={() => handleProcessLeave(leave.id, "disetujui")}><Check size={16} /></button>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                Tidak ada permohonan pending.
              </div>
            )}
          </div>
        </div>
      </div>


    </Layout>
  );
}
