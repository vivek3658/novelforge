import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DUMMY_NOVELS } from '../services/dummyNovels';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/novels?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/novels');
    }
  };

  const featuredNovels = DUMMY_NOVELS.slice(0, 4);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="app-container">
          <div className="hero-badge">
            <span>✨</span> Next-Gen Web Fiction Platform
          </div>

          <h1 className="hero-title">
            Where Stories Are <span className="hero-title-highlight">Forged</span> & Worlds Come Alive.
          </h1>

          <p className="hero-subtitle">
            Explore immersive serialized novels, read chapters distraction-free, and follow independent web fiction creators.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/profile" className="cta-primary">
                <span>Go to Dashboard ({user?.username})</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/novels" className="cta-primary">
                  <span>Start Reading Free</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link to="/login" className="cta-secondary">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <form className="hero-search-wrapper" onSubmit={handleSearchSubmit}>
            <svg
              className="hero-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by title, author, or genre (e.g. Fantasy, Sci-Fi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search novels by title or genre"
            />
          </form>
        </div>
      </section>

      {/* Trending Novels Section */}
      <section className="app-container" style={{ padding: '4rem 1.5rem' }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">🔥 Featured Web Serials</h2>
            <p className="section-subtitle">Top serials available for instant reading</p>
          </div>
          <Link to="/novels" className="section-see-all">
            Browse All Catalog <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="novels-grid">
          {featuredNovels.map((novel) => (
            <Link
              key={novel.id}
              to={`/novels/${novel.id}`}
              className="novel-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
              aria-label={`Read ${novel.title} by ${novel.author}`}
            >
              <div
                className="novel-cover-placeholder"
                style={{ background: novel.gradient }}
              >
                <span className="novel-badge-tag">{novel.categoryType || 'FICTION'}</span>
                <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
              </div>
              <div className="novel-info">
                <h3 className="novel-title">{novel.title}</h3>
                <div className="novel-author">by {novel.author || 'Author Unknown'}</div>
                <p className="novel-synopsis">{novel.synopsis}</p>
                <div className="novel-stats">
                  <span className="novel-rating">★ {novel.rating}</span>
                  <span>{novel.chapters?.length || 0} Chs</span>
                  <span>{novel.views} reads</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="app-container" style={{ paddingBottom: '5rem' }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">⚡ Platform Architecture & Security</h2>
            <p className="section-subtitle">Engineered with high performance microservices and accessible frontend standards</p>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper" aria-hidden="true">🛡️</div>
            <h3 className="feature-title">Secure Identity Service</h3>
            <p className="feature-desc">
              Spring Security microservice featuring stateless JWT tokens, 6-digit email OTP verification, and HttpOnly cookie refresh token rotation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" aria-hidden="true">🌐</div>
            <h3 className="feature-title">Unified API Gateway</h3>
            <p className="feature-desc">
              Clean reactive routing via Spring Cloud Gateway. All client requests route strictly through the public gateway without leaking internal microservices.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" aria-hidden="true">📖</div>
            <h3 className="feature-title">Accessible Reading Experience</h3>
            <p className="feature-desc">
              High-contrast typography, adjustable font sizing, serif/sans-serif toggles, Sepia and Dark reading themes, and keyboard arrow chapter flipping.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
