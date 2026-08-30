import React from 'react';
import { Link } from 'react-router-dom';
import './AuthPages.css';

const NotFound = () => {
  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          404
        </div>
        <h1 className="auth-title">Page Not Found</h1>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          The chapter or page you are looking for has vanished into the astral void.
        </p>
        <Link to="/" className="auth-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          Return to NovelForge Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
