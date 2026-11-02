import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({
  children: u
}) => {
  const {
      isAuthenticated: r,
      isLoading: d
    } = useAuth(),
    o = useLocation();
  return d ? <div className="loading-screen"><div className="spinner" /><p>Loading NovelForge session...</p></div> : r ? u : <Navigate to="/login" state={{
    from: o
  }} replace={!0} />;
};
export default ProtectedRoute;
