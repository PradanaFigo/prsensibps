import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { RefreshCw, Download } from "lucide-react";

export default function AdminLogbook() {
  const [logbooks, setLogbooks] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date());
  const [exportRange, setExportRange] = useState({ tanggal_awal: null, tanggal_akhir: null });
  const [msg, setMsg] = useState("");
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const params = {};
      if (exportRange.tanggal_awal) {
        params.tanggal_awal = new Date(exportRange.tanggal_awal.getTime() - exportRange.tanggal_awal.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      }
      if (exportRange.tanggal_akhir) {
        params.tanggal_akhir = new Date(exportRange.tanggal_akhir.getTime() - exportRange.tanggal_akhir.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      }
      const res = await apiClient.get("/logbook/export", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      
      let filename = "rekap_logbook_semua.xlsx";
      if (params.tanggal_awal && params.tanggal_akhir) filename = `rekap_logbook_${params.tanggal_awal}_sampai_${params.tanggal_akhir}.xlsx`;
      else if (params.tanggal_awal) filename = `rekap_logbook_mulai_${params.tanggal_awal}.xlsx`;
      else if (params.tanggal_akhir) filename = `rekap_logbook_sampai_${params.tanggal_akhir}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setMsg("Gagal export Excel");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      const userMap = {};
      res.data.forEach(u => {
        userMap[u.id] = u.nama;
      });
      setUsers(userMap);
    } catch (err) {
      console.error("Gagal memuat users", err);
    }
  };

  const loadLogbooks = async (date) => {
    setIsLoading(true);
    try {
      const params = {};
      if (date) params.tanggal = typeof date === "string" ? date : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const res = await apiClient.get("/logbook", { params });
      setLogbooks(res.data);
      setMsg("");
    } catch (err) {
      setMsg("Gagal memuat logbook");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadUsers();
      await loadLogbooks(new Date());
    };
    init();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadLogbooks(filterDate);
  };

  const handleResetFilter = () => {
    setFilterDate(null);
    loadLogbooks("");
  };

  return (
    <Layout title="Logbook Harian" role="admin" userName="Super Admin">
      
      {msg && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontWeight: 500 }}>{msg}</div>
        </div>
      )}

      {/* CARD 1: Filter Tanggal */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="filter-group">
          <label style={{ fontWeight: 600, color: "var(--text-main)" }}>Filter Tanggal:</label>
          <div style={{ width: "100%", maxWidth: "200px" }}>
            <DatePicker
              selected={filterDate}
              onChange={(d) => {
                setFilterDate(d);
                loadLogbooks(d);
              }}
              className="input-field"
              placeholderText="Semua Tanggal"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <button 
            className="btn-outline" 
            onClick={() => loadLogbooks(filterDate)} 
            disabled={isLoading}
            style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <RefreshCw size={18} className={isLoading ? "spin" : ""} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* CARD 2: Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={32} className="spin" style={{ margin: "0 auto", marginBottom: "16px" }} />
            Memuat catatan logbook...
          </div>
        ) : logbooks.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Tidak ada catatan logbook ditemukan untuk tanggal ini
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Nama Peserta</th>
                  <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Tanggal</th>
                  <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Kegiatan</th>
                  <th style={{ padding: "16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Waktu Pengisian</th>
                </tr>
              </thead>
              <tbody>
                {logbooks.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "16px", fontWeight: 500, color: "var(--text-main)" }}>
                      {users[log.user_id] || "User Tidak Diketahui"}
                    </td>
                    <td style={{ padding: "16px", color: "var(--text-muted)" }}>
                      {new Date(log.tanggal).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: "16px", maxWidth: "400px", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "var(--text-main)" }}>
                      {log.kegiatan}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
                      {new Date(log.created_at + (log.created_at.endsWith("Z") ? "" : "Z")).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CARD 3: Export */}
      <div className="card" style={{ marginTop: "24px" }}>
        <h3>Export Rekap Logbook</h3>
        <p style={{ fontSize: 14, marginBottom: 20 }}>Pilih rentang tanggal, lalu unduh rekap logbook dalam berkas Excel</p>
        
        <div className="filter-group">
          <div style={{ width: "100%", maxWidth: "200px" }}>
            <DatePicker
              selected={exportRange.tanggal_awal}
              onChange={(d) => setExportRange({ ...exportRange, tanggal_awal: d })}
              className="input-field"
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <span style={{ color: "var(--text-muted)", fontWeight: "bold" }}>-</span>
          <div style={{ width: "100%", maxWidth: "200px" }}>
            <DatePicker
              selected={exportRange.tanggal_akhir}
              onChange={(d) => setExportRange({ ...exportRange, tanggal_akhir: d })}
              className="input-field"
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
              minDate={exportRange.tanggal_awal}
            />
          </div>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px" }} 
            onClick={handleExportExcel}
          >
            <Download size={18} />
            Export Excel
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
