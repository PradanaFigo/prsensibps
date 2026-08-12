import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function UserLogbook() {
  const [logbooks, setLogbooks] = useState([]);
  const [form, setForm] = useState({ tanggal: null, kegiatan: "" });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", tanggal: null, kegiatan: "" });
  const [editMsg, setEditMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchLogbooks = async () => {
    try {
      const res = await apiClient.get("/logbook/me");
      setLogbooks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogbooks();
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
      await apiClient.post("/logbook", payload);
      setMsg("Logbook berhasil disimpan.");
      setForm({ tanggal: null, kegiatan: "" });
      fetchLogbooks();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Gagal menyimpan logbook");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (log) => {
    setEditForm({
      id: log.id,
      tanggal: new Date(log.tanggal),
      kegiatan: log.kegiatan
    });
    setEditMsg("");
    setShowEditModal(true);
  };

  const handleUpdateLogbook = async (e) => {
    e.preventDefault();
    setEditMsg("");
    setIsEditing(true);
    try {
      const payload = {
        tanggal: editForm.tanggal ? new Date(editForm.tanggal.getTime() - editForm.tanggal.getTimezoneOffset() * 60000).toISOString().split("T")[0] : null,
        kegiatan: editForm.kegiatan
      };
      await apiClient.put(`/logbook/${editForm.id}`, payload);
      setShowEditModal(false);
      fetchLogbooks();
    } catch (err) {
      setEditMsg(err.response?.data?.detail || "Gagal mengubah logbook");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteLogbook = async (id) => {
    if (!window.confirm("Yakin ingin menghapus catatan logbook ini?")) return;
    try {
      await apiClient.delete(`/logbook/${id}`);
      fetchLogbooks();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghapus logbook");
    }
  };

  const userName = localStorage.getItem("nama") || "Peserta Magang";

  return (
    <Layout title="Logbook Harian" role="user" userName={userName}>
      {showEditModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, 
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div className="card" style={{ maxWidth: "400px", width: "90%", margin: "0 auto", animation: "slideUp 0.3s ease-out" }}>
            <h3 style={{ marginBottom: 16 }}>Edit Logbook</h3>
            <form onSubmit={handleUpdateLogbook}>
              <div className="form-group">
                <label className="form-label">Tanggal Kegiatan</label>
                <div style={{ width: "100%" }}>
                  <DatePicker
                    selected={editForm.tanggal}
                    onChange={(date) => setEditForm({ ...editForm, tanggal: date })}
                    className="input-field"
                    placeholderText="dd/mm/yyyy"
                    dateFormat="dd/MM/yyyy"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Kegiatan</label>
                <textarea
                  className="input-field"
                  rows="5"
                  value={editForm.kegiatan}
                  onChange={(e) => setEditForm({ ...editForm, kegiatan: e.target.value })}
                  required
                  style={{ resize: "vertical" }}
                />
              </div>
              {editMsg && <div className="error-message">{editMsg}</div>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isEditing}>
                  {isEditing ? "Menyimpan..." : "Simpan"}
                </button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Form Isi Logbook */}
        <div className="card" style={{ alignSelf: "start" }}>
          <h3 style={{ marginBottom: "20px" }}>Isi Catatan Baru</h3>
          <form onSubmit={handleSubmit}>
            {msg && (
              <div className="error-message" style={{ backgroundColor: "#dcfce7", color: "#166534", borderLeftColor: "#166534" }}>
                {msg}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Tanggal Kegiatan</label>
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
              <label className="form-label">Deskripsi Kegiatan</label>
              <textarea
                className="input-field"
                rows="5"
                placeholder="Apa yang Anda kerjakan hari ini?"
                value={form.kegiatan}
                onChange={(e) => setForm({ ...form, kegiatan: e.target.value })}
                required
                style={{ resize: "vertical" }}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Logbook */}
        <div className="card" style={{ alignSelf: "start" }}>
          <h3 style={{ marginBottom: "20px" }}>Riwayat Logbook Anda</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kegiatan</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logbooks.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      Belum ada catatan logbook.
                    </td>
                  </tr>
                ) : (
                  logbooks.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
                        {new Date(log.tanggal).toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{log.kegiatan}</td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button className="btn-soft-warning" onClick={() => handleEditClick(log)}>Edit</button>
                          <button className="btn-soft-danger" onClick={() => handleDeleteLogbook(log.id)}>Hapus</button>
                        </div>
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
