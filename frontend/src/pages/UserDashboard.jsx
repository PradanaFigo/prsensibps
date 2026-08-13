import { useState, useEffect } from "react";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function UserDashboard() {
  const [absenMsg, setAbsenMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [riwayatHariIni, setRiwayatHariIni] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ old_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [showPwdModal1, setShowPwdModal1] = useState(false);
  const [showPwdModal2, setShowPwdModal2] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [leaveList, setLeaveList] = useState([]);

  const fetchData = async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        apiClient.get("/attendance/me"),
        apiClient.get("/leave/me")
      ]);
      
      setHistoryList(attRes.data);
      setLeaveList(leaveRes.data);

      if (attRes.data.length > 0) {
        const todayObj = new Date();
        const y = todayObj.getFullYear();
        const m = String(todayObj.getMonth() + 1).padStart(2, '0');
        const d = String(todayObj.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`; 
        
        const todayRecord = attRes.data.find(r => r.tanggal === todayStr);
        setRiwayatHariIni(todayRecord);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAbsen = (type) => {
    setAbsenMsg("Mendapatkan lokasi Anda...");
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      setAbsenMsg("Browser tidak mendukung akses lokasi");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const endpoint = type === 'masuk' ? '/attendance/masuk' : '/attendance/pulang';
          await apiClient.post(endpoint, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setAbsenMsg(`Absen ${type} berhasil dicatat.`);
          fetchData();
        } catch (err) {
          setAbsenMsg(err.response?.data?.detail || `Absen ${type} gagal`);
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setAbsenMsg("Gagal mengambil lokasi, pastikan izin lokasi diaktifkan");
        setIsLoading(false);
      }
    );
  };

  // Helper untuk Kalender
  const renderCalendar = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Tanggal 1 ada di hari apa (0 = Minggu, 1 = Senin)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const recordMap = {};
    
    leaveList.forEach(l => {
      if (l.status_approval === 'disetujui') {
        recordMap[l.tanggal] = { type: 'leave', data: l };
      }
    });

    historyList.forEach(a => {
      recordMap[a.tanggal] = { type: 'attendance', data: a };
    });

    const getStatusColor = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const record = recordMap[dateStr];
      
      if (record) {
        if (record.type === 'leave') {
          return { bg: "#eff6ff", color: "#1e3a8a", dot: "#3b82f6", title: record.data.jenis.toUpperCase() }; 
        } else {
          const statusLower = record.data.status.toLowerCase();
          if (statusLower === 'hadir') {
            return { bg: "#dcfce7", color: "#166534", dot: "#10b981", title: "Hadir" }; 
          } else if (statusLower === 'telat') {
            return { bg: "#fef3c7", color: "#d97706", dot: "#f59e0b", title: "Telat" }; 
          } else {
            return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", title: "Alpa" }; 
          }
        }
      }
      
      // Cek apakah tanggal di masa depan
      // Reset jam untuk komparasi tanggal murni
      const pureToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (dateObj > pureToday) return { bg: "#f8fafc", color: "#94a3b8", dot: "transparent", title: "Belum absen" };
      if (dateObj.getTime() === pureToday.getTime()) return { bg: "#f8fafc", color: "#94a3b8", dot: "transparent", title: "Hari Ini (Belum Absen)" };
      
      if (isWeekend) return { bg: "#f1f5f9", color: "#94a3b8", dot: "#cbd5e1", title: "Libur Akhir Pekan" }; 
      
      // Weekday di masa lalu tapi tidak ada record = Alpa
      return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", title: "Alpa (Tanpa Keterangan)" };
    };

    const days = [];
    const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    const header = weekdays.map(day => (
      <div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#64748b', paddingBottom: '8px' }}>
        {day}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-empty-cell"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const isToday = d === today.getDate();
      const styleInfo = getStatusColor(dateObj);
      const isHovered = hoveredDate === d;
      
      days.push(
        <div 
          key={d} 
          className="calendar-day-cell"
          style={{ 
            backgroundColor: styleInfo.bg, 
            border: isToday ? '2px solid var(--primary-blue)' : '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            setHoveredDate(d);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            setHoveredDate(null);
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: isToday ? 700 : 600, color: styleInfo.color }}>{d}</span>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: styleInfo.dot, marginTop: '2px' }}></div>
          
          {isHovered && styleInfo.title && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              padding: '6px 12px',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              zIndex: 10,
              pointerEvents: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {styleInfo.title}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '5px',
                borderStyle: 'solid',
                borderColor: '#1e293b transparent transparent transparent'
              }}></div>
            </div>
          )}
        </div>
      );
    }

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return (
      <div className="card calendar-card">
        <h3 style={{ marginBottom: "16px" }}>Rapor Kehadiran ({monthNames[currentMonth]} {currentYear})</h3>
        <div className="calendar-legend">
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }}></div> Hadir</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }}></div> Telat</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div> Izin</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div> Alpa</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#cbd5e1" }}></div> Libur/Belum</div>
        </div>
        <div className="calendar-grid">
          {header}
          {days}
        </div>
      </div>
    );
  };

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

  const userName = localStorage.getItem("nama") || "Peserta Magang";

  return (
    <Layout title="Dashboard" role="user" userName={userName}>
      {/* Location Card Area (Membentang Penuh) */}
      <div className="location-card-content" style={{ backgroundColor: "#fef3c7", color: "var(--primary-blue)", padding: "32px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid rgba(194, 143, 50, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: "8px", height: "8px", backgroundColor: "var(--primary-blue)", borderRadius: "50%" }}></div>
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 600 }}>Location Check</h3>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "14px" }}>Pastikan Anda berada di area BPS saat absen</p>
          </div>
        </div>
      </div>

      <div className="dashboard-columns">
        
        {/* KOLOM KIRI (Aksi Utama & Aktivitas) */}
        <div className="dashboard-col-left">

          {/* Tombol Absen */}
          <div className="absen-btn-grid" style={{ marginBottom: "24px" }}>
            {/* Absen Masuk */}
            <div className="card" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Presensi masuk</div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: riwayatHariIni?.jam_masuk ? "var(--text-main)" : "var(--text-muted)" }}>
                  {riwayatHariIni?.jam_masuk ? riwayatHariIni.jam_masuk.substring(0,5) : "--:--"}
                </div>
              </div>
              <button 
                className="btn-primary" 
                style={{ marginTop: "24px" }}
                onClick={() => handleAbsen('masuk')}
                disabled={isLoading || riwayatHariIni?.jam_masuk}
              >
                {riwayatHariIni?.jam_masuk ? "Sudah Absen Masuk" : "Absen Masuk"}
              </button>
            </div>

            {/* Absen Pulang */}
            <div className="card" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Presensi pulang</div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: riwayatHariIni?.jam_pulang ? "var(--text-main)" : "var(--text-muted)" }}>
                  {riwayatHariIni?.jam_pulang ? riwayatHariIni.jam_pulang.substring(0,5) : "--:--"}
                </div>
              </div>
              <button 
                className="btn-primary" 
                style={{ marginTop: "24px" }}
                onClick={() => handleAbsen('pulang')}
                disabled={isLoading || !riwayatHariIni?.jam_masuk || riwayatHariIni?.jam_pulang}
              >
                {riwayatHariIni?.jam_pulang ? "Sudah Absen Pulang" : "Absen Pulang"}
              </button>
            </div>
          </div>

          {absenMsg && (
            <div style={{ padding: "12px 16px", backgroundColor: "#fef9c3", color: "#854d0e", borderRadius: "8px", fontWeight: 500 }}>
              Info: {absenMsg}
            </div>
          )}

          {/* Aktivitas Hari Ini */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ marginBottom: "20px" }}>Aktivitas hari ini</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Kejadian</th>
                    <th style={{ width: "20%" }}>Waktu</th>
                    <th style={{ width: "25%" }}>Jarak</th>
                    <th style={{ width: "25%" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatHariIni?.jam_masuk && (
                    <tr>
                      <td style={{ fontWeight: 500 }}>Presensi masuk</td>
                      <td>{riwayatHariIni.jam_masuk.substring(0,5)}</td>
                      <td>{Math.round(riwayatHariIni.jarak_masuk)} m</td>
                      <td>
                        <span className={`badge ${riwayatHariIni.status === 'Hadir' ? 'badge-success' : 'badge-danger'}`}>
                          {riwayatHariIni.status}
                        </span>
                      </td>
                    </tr>
                  )}
                  {riwayatHariIni?.jam_pulang && (
                    <tr>
                      <td style={{ fontWeight: 500 }}>Presensi pulang</td>
                      <td>{riwayatHariIni.jam_pulang.substring(0,5)}</td>
                      <td>{Math.round(riwayatHariIni.jarak_pulang)} m</td>
                      <td><span className="badge badge-success">Tercatat</span></td>
                    </tr>
                  )}
                  {!riwayatHariIni?.jam_masuk && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        Belum ada aktivitas hari ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (Kalender) - Di samping pada Desktop, di Paling Bawah pada Mobile HP */}
        <div className="dashboard-col-right">
          {renderCalendar()}
        </div>

      </div>
    </Layout>
  );
}
