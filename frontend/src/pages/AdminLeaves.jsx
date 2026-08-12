import { useState, useEffect } from "react";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState({});
  const [msg, setMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      const userMap = {};
      res.data.forEach(u => {
        userMap[u.id] = u.nama;
      });
      setUsers(userMap);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await apiClient.get("/leave");
      setLeaves(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMsg(typeof detail === "string" ? detail : "Gagal memuat data izin");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLeaves();
    const interval = setInterval(() => {
      fetchLeaves();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, status) => {
    try {
      await apiClient.put(`/leave/${id}/approve`, { status });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal memproses pengajuan");
    }
  };

  const adminName = "Super Admin"; // Fetch from context

  return (
    <Layout title="Persetujuan Izin" role="admin" userName={adminName}>
      <div className="card">
        <h3>Daftar Pengajuan Izin/Sakit</h3>
        <p style={{ fontSize: 14, marginBottom: 20 }}>Tinjau dan berikan persetujuan untuk peserta magang</p>
        
        {msg && <div className="error-message">{msg}</div>}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Peserta</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Tidak ada pengajuan izin saat ini.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 500 }}>{users[leave.user_id] || "User Tidak Diketahui"}</td>
                    <td>{new Date(leave.tanggal).toLocaleDateString("id-ID")}</td>
                    <td>
                      <span className={`badge ${leave.jenis === 'sakit' ? 'badge-danger' : 'badge-warning'}`}>
                        {leave.jenis.charAt(0).toUpperCase() + leave.jenis.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>{leave.keterangan || "-"}</td>
                    <td>
                      <span className={`badge ${
                        (leave.status_approval || 'pending') === 'disetujui' ? 'badge-success' : 
                        (leave.status_approval || 'pending') === 'ditolak' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {(leave.status_approval || 'pending').charAt(0).toUpperCase() + (leave.status_approval || 'pending').slice(1)}
                      </span>
                    </td>
                    <td>
                      {(leave.status_approval || "pending") === "pending" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            className="badge badge-success" 
                            style={{ border: "none", cursor: "pointer", padding: "6px 12px" }}
                            onClick={() => handleAction(leave.id, "disetujui")}
                          >
                            Setujui
                          </button>
                          <button 
                            className="badge badge-danger"
                            style={{ border: "none", cursor: "pointer", padding: "6px 12px" }}
                            onClick={() => handleAction(leave.id, "ditolak")}
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
