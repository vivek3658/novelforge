import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Trending', path: '/trending' },
    { name: 'Novels', path: '/novels' },
    { name: 'Categories', path: '/categories' },
    { name: 'Community', path: '/community' },
  ];

  return (
    <header className="navbar-wrapper">
      <nav id="nav" className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link" aria-label="NovelForge Home">
            <img src={Logo} alt="NovelForge" id="nav-logo" />
            {/* <span className="brand-text">NovelForge</span> */}
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <ul id="nav-paths" className="desktop-links">
          {navLinks.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Action Controls: Theme Switcher & Auth Area */}
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? (
              // Sun Icon
              <svg
                className="theme-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              // Moon Icon
              <svg
                className="theme-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* User Auth Buttons / User Avatar Menu */}
          {isAuthenticated && user ? (
            <div className="user-menu-container">
              <button
                className="user-profile-btn"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                aria-expanded={userDropdownOpen}
              >
                <span className="user-avatar-circle">
                  {(user.username || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="user-display-name">{user.username}</span>
                <svg
                  className={`chevron-icon ${userDropdownOpen ? 'open' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <p className="dropdown-username">{user.username}</p>
                    <p className="dropdown-email">{user.email || 'Reader'}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile (/me)
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul id="nav-links" className="desktop-auth-links">
              <li>
                <Link to="/login" id="nav-login">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/register" id="nav-signup">
                  Sign Up
                </Link>
              </li>
            </ul>
          )}

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            className={`mobile-hamburger ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-inner">
          <ul className="mobile-nav-paths">
            {navLinks.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <hr className="drawer-divider" />

          {isAuthenticated && user ? (
            <div className="mobile-auth-section">
              <Link to="/profile" className="mobile-profile-link">
                <span className="user-avatar-circle">
                  {(user.username || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="mobile-user-details">
                  <span className="mobile-username">{user.username}</span>
                  <span className="mobile-user-sub">View Account (/me)</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="mobile-logout-btn">
                Log out
              </button>
            </div>
          ) : (
            <div className="mobile-guest-actions">
              <Link to="/login" className="mobile-login-btn">
                Log in
              </Link>
              <Link to="/register" className="mobile-signup-btn">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
    </header>
  );
};

export default Navbar;
