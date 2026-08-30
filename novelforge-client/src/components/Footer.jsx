import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/logo.png';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand-col">
          <Link to="/" className="footer-logo-link">
            <img src={Logo} alt="NovelForge" className="footer-logo" />
            <span className="footer-brand-name">NovelForge</span>
          </Link>
          <h2 className="footer-headline">
            Build worlds, publish chapters, and shape stories together.
          </h2>
          <p className="footer-description">
            A next-generation platform for web novelists, readers, and creators to forge extraordinary stories.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4 className="footer-heading">Explore</h4>
            <ul className="footer-list">
              <li><Link to="/trending">Trending Novels</Link></li>
              <li><Link to="/novels">Browse Library</Link></li>
              <li><Link to="/categories">Genres & Tags</Link></li>
              <li><Link to="/community">Creator Community</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Account</h4>
            <ul className="footer-list">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/forgot-password">Reset Password</Link></li>
              <li><Link to="/profile">Profile & Settings</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Identity API</h4>
            <ul className="footer-list">
              <li><span className="api-badge">Cookie Auth</span></li>
              <li><span className="api-badge">Silent Refresh</span></li>
              <li><span className="api-badge">OTP Verification</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} NovelForge. All rights reserved.
        </p>
        <div className="footer-meta-tags">
          <span>Minimal Light & Dark Theme</span>
          <span>•</span>
          <span>Full Mobile Responsive</span>
          <span>•</span>
          <span>Spring Security JWT</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
