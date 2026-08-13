import { useState, useEffect } from "react";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function UserHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get("/attendance/me");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const userName = localStorage.getItem("nama") || "Peserta Magang";

  return (
    <Layout title="Riwayat Absensi" role="user" userName={userName}>
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>Semua Riwayat Kehadiran Anda</h3>
        
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Memuat data...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      Belum ada riwayat absensi.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                        {new Date(record.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>{record.jam_masuk ? record.jam_masuk.substring(0, 5) : "-"}</td>
                      <td>{record.jam_pulang ? record.jam_pulang.substring(0, 5) : "-"}</td>
                      <td>
                        <span className={`badge ${
                          record.status === 'Hadir' ? 'badge-success' : 
                          record.status === 'Telat' || record.status === 'Alpa' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {record.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
