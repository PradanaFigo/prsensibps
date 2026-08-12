import { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function UserLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ tanggal: null, jenis: "izin", keterangan: "" });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      const res = await apiClient.get("/leave/me");
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const interval = setInterval(() => {
      fetchLeaves();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        tanggal: form.tanggal ? new Date(form.tanggal.getTime() - form.tanggal.getTimezoneOffset() * 60000).toISOString().split("T")[0] : null
      };
      await apiClient.post("/leave", payload);
      setMsg("Pengajuan berhasil dikirim dan menunggu persetujuan Admin.");
      setForm({ tanggal: null, jenis: "izin", keterangan: "" });
      fetchLeaves();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMsg(typeof detail === "string" ? detail : "Gagal mengajukan izin (Cek form isian)");
    } finally {
      setIsLoading(false);
    }
  };

  const userName = localStorage.getItem("nama") || "Peserta Magang";

  return (
    <Layout title="Izin & Sakit" role="user" userName={userName}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Form Pengajuan */}
        <div className="card" style={{ alignSelf: "start" }}>
          <h3 style={{ marginBottom: "20px" }}>Ajukan Izin/Sakit</h3>
          <form onSubmit={handleSubmit}>
            {msg && (
              <div className="error-message" style={{ backgroundColor: "#dcfce7", color: "#166534", borderLeftColor: "#166534", marginBottom: "16px" }}>
                {msg}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <div style={{ width: "100%" }}>
                <DatePicker
                  selected={form.tanggal}
                  onChange={(date) => setForm({ ...form, tanggal: date })}
                  className="input-field"
                  placeholderText="dd/mm/yyyy"
                  dateFormat="dd/MM/yyyy"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Jenis</label>
              <Select
                value={{ value: form.jenis, label: form.jenis === 'izin' ? 'Izin' : 'Sakit' }}
                onChange={(selected) => setForm({ ...form, jenis: selected.value })}
                options={[
                  { value: 'izin', label: 'Izin' },
                  { value: 'sakit', label: 'Sakit' }
                ]}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Keterangan Tambahan</label>
              <textarea
                className="input-field"
                rows="4"
                placeholder="Misal: Ada acara keluarga, Sedang demam..."
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: "100%" }}>
              {isLoading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pengajuan */}
        <div className="card" style={{ alignSelf: "start" }}>
          <h3 style={{ marginBottom: "20px" }}>Riwayat Pengajuan</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      Belum ada riwayat pengajuan.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(l.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td style={{ fontWeight: 500 }}>{l.jenis}</td>
                      <td>{l.keterangan || "-"}</td>
                      <td>
                        <span className={`badge ${
                          (l.status_approval || 'pending') === 'disetujui' ? 'badge-success' : 
                          (l.status_approval || 'pending') === 'ditolak' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {(l.status_approval || 'pending').charAt(0).toUpperCase() + (l.status_approval || 'pending').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}
