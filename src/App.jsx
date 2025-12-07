import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainApp from './MainApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <MainApp initialPage="admin" />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
