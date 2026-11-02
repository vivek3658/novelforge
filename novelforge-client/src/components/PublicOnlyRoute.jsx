import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicOnlyRoute = ({
  children: u
}) => {
  const {
    isAuthenticated: r,
    isLoading: d
  } = useAuth();
  return d ? <div className="loading-screen"><div className="spinner" /></div> : r ? <Navigate to="/profile" replace={!0} /> : u;
};
export default PublicOnlyRoute;
