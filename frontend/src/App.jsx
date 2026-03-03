import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { useAuth } from './context/AuthContext';
import Navbar    from './components/Navbar';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students  from './pages/Students';
import Drives    from './pages/Drives';
import Reports   from './pages/Reports';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <CssBaseline />
      {isAuthenticated && <Navbar />}
      {/* Push content below the fixed AppBar when logged in */}
      <div style={{ marginTop: isAuthenticated ? 64 : 0 }}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route path="/"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students  /></ProtectedRoute>} />
          <Route path="/drives"   element={<ProtectedRoute><Drives    /></ProtectedRoute>} />
          <Route path="/reports"  element={<ProtectedRoute><Reports   /></ProtectedRoute>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
