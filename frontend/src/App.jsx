import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminAttendance from "./pages/AdminAttendance.jsx";
import AdminLeaves from "./pages/AdminLeaves.jsx";
import AdminLogbook from "./pages/AdminLogbook.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import Login from "./pages/Login.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import UserLogbook from "./pages/UserLogbook.jsx";
import UserLeaves from "./pages/UserLeaves.jsx";
import UserHistory from "./pages/UserHistory.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logbook"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLogbook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect rute admin lainnya ke /admin */}
        <Route path="/admin/accounts" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/recap" element={<Navigate to="/admin" replace />} />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logbook"
          element={
            <ProtectedRoute allowedRole="user">
              <UserLogbook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute allowedRole="user">
              <UserLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRole="user">
              <UserHistory />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
