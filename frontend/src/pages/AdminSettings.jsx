import { useState, useEffect } from "react";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { Clock, Save } from "lucide-react";

export default function AdminSettings() {
  const [cutoffTime, setCutoffTime] = useState("");
  const [radius, setRadius] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [timeRes, radiusRes] = await Promise.all([
          apiClient.get("/settings/ATTENDANCE_CUTOFF_TIME"),
          apiClient.get("/settings/OFFICE_RADIUS_METERS")
        ]);
        setCutoffTime(timeRes.data.value);
        setRadius(radiusRes.data.value);
      } catch (err) {
        console.error("Gagal mengambil pengaturan", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");
    
    try {
      await Promise.all([
        apiClient.put("/settings/ATTENDANCE_CUTOFF_TIME", { value: cutoffTime }),
        apiClient.put("/settings/OFFICE_RADIUS_METERS", { value: radius.toString() })
      ]);
      setMsg("Pengaturan aplikasi berhasil diperbarui.");
      setIsSuccess(true);
    } catch (err) {
      setMsg("Gagal menyimpan pengaturan.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Pengaturan Aplikasi" role="admin" userName="Admin">
      
      {msg && (
        <div style={{ padding: "16px", backgroundColor: isSuccess ? "#dcfce7" : "#fee2e2", color: isSuccess ? "#166534" : "#991b1b", borderRadius: "8px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontWeight: 500 }}>{msg}</div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "stretch" }}>
          
          {/* KOLOM 1: Jam Absen */}
          <div className="card" style={{ padding: "32px", margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ padding: "12px", backgroundColor: "#fef3c7", color: "#d97706", borderRadius: "12px" }}>
                <Clock size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>Batas Jam Absen</h3>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Parameter toleransi keterlambatan</div>
              </div>
            </div>

            <div style={{ marginBottom: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                Peserta magang yang menekan tombol absen masuk melewati batas jam ini akan secara otomatis dilabeli dengan status <strong>"Telat"</strong> (warna kuning). Sebelum jam ini, statusnya adalah <strong>"Hadir"</strong> (warna hijau).
              </p>
              
              <div style={{ marginTop: "auto" }}>
                <input
                  type="time"
                  className="input-field"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  required
                  style={{ width: "100%", fontSize: "18px", padding: "12px 16px", fontWeight: 600, textAlign: "center", backgroundColor: "#f8fafc", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                />
              </div>
            </div>
          </div>

          {/* KOLOM 2: Radius */}
          <div className="card" style={{ padding: "32px", margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ padding: "12px", backgroundColor: "#dbeafe", color: "#2563eb", borderRadius: "12px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>Radius Jarak Absensi</h3>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Batas toleransi lokasi (GPS)</div>
              </div>
            </div>

            <div style={{ marginBottom: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                Jarak maksimal yang diperbolehkan dari titik koordinat kantor agar absen valid. Jika lebih dari ini, absen masuk atau pulang akan otomatis ditolak oleh sistem.
              </p>
              
              <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
                <input
                  type="number"
                  className="input-field"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  required
                  min="50"
                  step="10"
                  style={{ flex: 1, fontSize: "18px", padding: "12px 16px", fontWeight: 600, textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px 0 0 8px", borderRight: "none", border: "1px solid var(--border-color)" }}
                />
                <div style={{ padding: "12px 16px", backgroundColor: "#e2e8f0", border: "1px solid var(--border-color)", borderLeft: "none", borderRadius: "0 8px 8px 0", color: "var(--text-muted)", fontWeight: 600, fontSize: "18px" }}>
                  meter
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", fontSize: "16px", borderRadius: "12px" }}>
            <Save size={20} />
            {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
