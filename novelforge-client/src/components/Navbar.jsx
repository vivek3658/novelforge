import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  ['Discover', '/novels'],
  ['Latest', '/trending'],
  ['Genres', '/categories'],
  ['Community', '/community'],
];

export default function Navbar() {
  const { user, isAuthenticated, roles = [], logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const isStaff = roles.includes('ADMIN') || roles.includes('MODERATOR');

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="site-brand" to="/" aria-label="NovelForge home">
          <span className="brand-mark">N</span>
          <span>NovelForge</span>
        </Link>

        <div className="site-links">
          {NAV_LINKS.map(([label, href]) => (
            <NavLink key={href} to={href} end={href === '/'}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="site-actions">
          <button
            className="nav-icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            {isDark ? '☼' : '☾'}
          </button>

          {isAuthenticated ? (
            <React.Fragment>
              {isStaff && (
                <Link
                  className="nav-studio"
                  to="/admin"
                >
                  Staff
                </Link>
              )}
              <Link className="nav-library" to="/library">
                My library
              </Link>
              <Link className="nav-studio" to="/studio">
                Studio
              </Link>
              <button
                className="nav-avatar"
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Open account menu"
              >
                {(user?.username || user?.displayName || 'R').slice(0, 1).toUpperCase()}
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Link className="nav-signin" to="/login">
                Sign in
              </Link>
              <Link className="nav-studio" to="/register">
                Join NovelForge
              </Link>
            </React.Fragment>
          )}

          <button
            className="nav-menu-button"
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            ☰
          </button>
        </div>

        {isMenuOpen && (
          <div className="nav-popover">
            {NAV_LINKS.map(([label, href]) => (
              <Link key={href} to={href} onClick={() => setIsMenuOpen(false)}>
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <React.Fragment>
                <div className="nav-popover-user">
                  <strong>{user?.displayName || user?.username || 'Reader'}</strong>
                  <span>{user?.email || 'Your NovelForge account'}</span>
                </div>
                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    style={{ color: 'var(--primary)', fontWeight: 700 }}
                  >
                    Staff / Admin Console
                  </Link>
                )}
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  Account settings
                </Link>
                <Link to="/library" onClick={() => setIsMenuOpen(false)}>
                  My library
                </Link>
                <Link to="/studio" onClick={() => setIsMenuOpen(false)}>
                  Creator Studio
                </Link>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </React.Fragment>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
