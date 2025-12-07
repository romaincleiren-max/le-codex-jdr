import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('le-codex-admin-auth') === 'true';
  return isAuth ? children : <Navigate to="/login" replace />;
};
