import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PlayerRoute } from './components/PlayerRoute';
import MainApp from './MainApp';
import PlayerDashboard from './pages/PlayerDashboard';
import CharacterSheetPage from './pages/CharacterSheetPage';
import LevelUpWizardPage from './pages/LevelUpWizardPage';
import CharacterForgePage from './pages/CharacterForgePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Routes joueurs */}
        <Route path="/forge" element={
          <PlayerRoute>
            <CharacterForgePage onBack={() => window.history.back()} />
          </PlayerRoute>
        } />
        <Route path="/player" element={
          <PlayerRoute>
            <PlayerDashboard />
          </PlayerRoute>
        } />
        <Route path="/character/:id" element={
          <PlayerRoute>
            <CharacterSheetPage />
          </PlayerRoute>
        } />
        <Route path="/character/:id/levelup" element={
          <PlayerRoute>
            <LevelUpWizardPage />
          </PlayerRoute>
        } />

        {/* Routes admin */}
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
