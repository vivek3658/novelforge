import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DUMMY_NOVELS } from '../services/dummyNovels';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNovels = DUMMY_NOVELS.slice(0, 4).filter((novel) =>
    novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (novel.categoryType && novel.categoryType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (novel.synopsis && novel.synopsis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="app-container">
          <div className="hero-badge">
            <span>✨</span> Next-Gen Web Novel Platform
          </div>

          <h1 className="hero-title">
            Where Stories Are <span className="hero-title-highlight">Forged</span> & Worlds Come Alive.
          </h1>

          <p className="hero-subtitle">
            Explore thousands of immersive serialized novels, support indie authors, and shape immersive stories together with interactive community feedback.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/profile" className="cta-primary">
                <span>Go to Dashboard ({user?.username})</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="cta-primary">
                  <span>Start Reading Free</span>
                  <span>→</span>
                </Link>
                <Link to="/login" className="cta-secondary">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="hero-search-wrapper">
            <svg
              className="hero-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by title, author, or genre (e.g. Fantasy, Sci-Fi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Trending Novels Section */}
      <section className="app-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">🔥 Trending Novels</h2>
            <p className="section-subtitle">Top serials trending across NovelForge this week</p>
          </div>
          <Link to="/trending" className="section-see-all">
            Browse All <span>→</span>
          </Link>
        </div>

        <div className="novels-grid">
          {filteredNovels.map((novel) => (
            <article key={novel.id} className="novel-card">
              <div
                className="novel-cover-placeholder"
                style={{ background: novel.gradient }}
              >
                <span className="novel-badge-tag">{novel.categoryType || novel.genre || 'FICTION'}</span>
                <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
              </div>
              <div className="novel-info">
                <h3 className="novel-title">{novel.title}</h3>
                <div className="novel-author">by {novel.author || 'Author Unknown'}</div>
                <p className="novel-synopsis">{novel.synopsis}</p>
                <div className="novel-stats">
                  <span className="novel-rating">★ {novel.rating}</span>
                  <span>{novel.chapters ? `${novel.chapters} Chs` : '0 Chs'}</span>
                  <span>{novel.views} reads</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Features & Architecture Grid */}
      <section className="app-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">⚡ Platform Architecture</h2>
            <p className="section-subtitle">Engineered with high performance microservices</p>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">🛡️</div>
            <h3 className="feature-title">Secure Identity Service</h3>
            <p className="feature-desc">
              Full Spring Security 6 microservice with stateless JWT authentication, OTP email verification, and HttpOnly cookie refresh token rotation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">🌐</div>
            <h3 className="feature-title">API Gateway & Eureka</h3>
            <p className="feature-desc">
              Dynamic reactive service routing via Spring Cloud Gateway and Eureka service discovery for unified endpoints across services.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">📱</div>
            <h3 className="feature-title">Fully Responsive & Dual Theme</h3>
            <p className="feature-desc">
              Sleek minimal white mode and deep dark mode with complete mobile responsiveness, gesture-friendly navigation drawer, and instant feedback.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
