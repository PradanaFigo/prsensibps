import { useState, useEffect } from "react";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { Download, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StatusDropdown = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ position: "relative" }} tabIndex={0} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false); }}>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: "white",
          color: "#334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "130px",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <span>{value}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 50,
          overflow: "hidden",
          textAlign: "left"
        }}>
          {["Hadir", "Telat", "Alpa"].map(option => (
            <div 
              key={option}
              onClick={() => { onChange(option); setIsOpen(false); }}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                cursor: "pointer",
                backgroundColor: value === option ? "#f1f5f9" : "transparent",
                color: value === option ? "#0f172a" : "#475569",
                fontWeight: value === option ? 600 : 400,
                transition: "background-color 0.1s"
              }}
              onMouseEnter={(e) => { if (value !== option) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
              onMouseLeave={(e) => { if (value !== option) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminAttendance() {
  const [filterDate, setFilterDate] = useState(new Date());
  const [rekapRange, setRekapRange] = useState({ tanggal_awal: new Date(), tanggal_akhir: new Date() });
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchRecords();
  }, [filterDate]);

  const fetchRecords = async () => {
    setIsLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const formattedDate = new Date(filterDate.getTime() - filterDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const res = await apiClient.get(`/recap?tanggal_awal=${formattedDate}&tanggal_akhir=${formattedDate}`);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ text: "Gagal mengambil data kehadiran", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRange = async () => {
    if (!rekapRange.tanggal_awal || !rekapRange.tanggal_akhir) return;
    setIsUpdating("export");
    try {
      const start = new Date(rekapRange.tanggal_awal.getTime() - rekapRange.tanggal_awal.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const end = new Date(rekapRange.tanggal_akhir.getTime() - rekapRange.tanggal_akhir.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      
      const res = await apiClient.get(`/recap/export?tanggal_awal=${start}&tanggal_akhir=${end}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rekap_absensi_${start}_to_${end}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setMsg({ text: "Gagal mengunduh Excel", type: "error" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setIsUpdating(userId);
    try {
      const formattedDate = new Date(filterDate.getTime() - filterDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      await apiClient.put("/recap/update-status", {
        user_id: userId,
        tanggal: formattedDate,
        status: newStatus
      });
      setMsg({ text: `Status berhasil diubah menjadi ${newStatus}`, type: "success" });
      fetchRecords();
    } catch (err) {
      console.error(err);
      setMsg({ text: "Gagal mengubah status", type: "error" });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Layout title="Data Presensi Harian" role="admin" userName="Admin">
      {msg.text && (
        <div style={{ padding: "16px", backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2", color: msg.type === "success" ? "#166534" : "#991b1b", borderRadius: "8px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontWeight: 500 }}>{msg.text}</div>
        </div>
      )}

      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ fontWeight: 600, color: "var(--text-main)" }}>Filter Tanggal:</label>
            <div style={{ width: "200px" }}>
              <DatePicker
                selected={filterDate}
                onChange={(d) => setFilterDate(d)}
                className="input-field"
                placeholderText="dd/mm/yyyy"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <button 
              className="btn-outline" 
              onClick={fetchRecords} 
              disabled={isLoading}
              style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <RefreshCw size={18} className={isLoading ? "spin" : ""} />
              Muat Ulang
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={32} className="spin" style={{ margin: "0 auto", marginBottom: "16px" }} />
            Memuat data presensi...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Tidak ada data presensi untuk tanggal ini
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Nama Peserta</th>
                  <th style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Jam Masuk</th>
                  <th style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Jam Pulang</th>
                  <th style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Aksi (Ubah Status)</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "16px", fontWeight: 500, color: "var(--text-main)" }}>
                      {r.nama}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            r.status === "Hadir" ? "#dcfce7" :
                            r.status === "Telat" ? "#fef9c3" :
                            r.status === "Izin" || r.status === "Sakit" ? "#fef3c7" : "#fee2e2",
                          color:
                            r.status === "Hadir" ? "#166534" :
                            r.status === "Telat" ? "#854d0e" :
                            r.status === "Izin" || r.status === "Sakit" ? "#b45309" : "#991b1b",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {r.status === "Hadir" && <CheckCircle size={14} />}
                        {r.status === "Alpa" && <XCircle size={14} />}
                        {r.status === "Telat" && <AlertCircle size={14} />}
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
                      {r.jam_masuk ? r.jam_masuk.slice(0, 5) : "-"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
                      {r.jam_pulang ? r.jam_pulang.slice(0, 5) : "-"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      {r.status === "Izin" || r.status === "Sakit" ? (
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Cuti disetujui</span>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          <StatusDropdown 
                            value={r.status}
                            onChange={(newStatus) => handleUpdateStatus(r.user_id, newStatus)}
                            disabled={isUpdating === r.user_id}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3>Export Rekap Presensi</h3>
        <p style={{ fontSize: 14, marginBottom: 20 }}>Pilih rentang tanggal, lalu unduh rekap presensi dalam berkas Excel</p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ width: "200px" }}>
            <DatePicker
              selected={rekapRange.tanggal_awal}
              onChange={(d) => setRekapRange({ ...rekapRange, tanggal_awal: d })}
              className="input-field"
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <span style={{ color: "var(--text-muted)", fontWeight: "bold" }}>-</span>
          <div style={{ width: "200px" }}>
            <DatePicker
              selected={rekapRange.tanggal_akhir}
              onChange={(d) => setRekapRange({ ...rekapRange, tanggal_akhir: d })}
              className="input-field"
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px" }} 
            onClick={handleExportRange}
            disabled={isUpdating === "export"}
          >
            <Download size={18} />
            {isUpdating === "export" ? "Mengunduh..." : "Export Excel"}
          </button>
        </div>
      </div>
      
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}
