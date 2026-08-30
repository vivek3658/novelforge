import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const SAMPLE_NOVELS = [
  {
    id: 1,
    title: 'Shadows of the Astral Realm',
    author: 'Elena Vance',
    genre: 'Fantasy / Cultivation',
    synopsis: 'A fallen prodigy discovers an ancient forbidden scroll that binds cosmic constellations to his spirit soul.',
    rating: 4.9,
    views: '124K',
    chapters: 142,
    gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  },
  {
    id: 2,
    title: 'Cyberpunk Odyssey 2099',
    author: 'Kaelen Cross',
    genre: 'Sci-Fi / Cyberpunk',
    synopsis: 'In a rain-drenched megacity governed by neural AI overlords, a rogue data smuggler uncovers a fatal glitch in humanity.',
    rating: 4.8,
    views: '98K',
    chapters: 89,
    gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  },
  {
    id: 3,
    title: 'The Alchemist of Forgotten Stars',
    author: 'Aria Thorne',
    genre: 'LitRPG / Adventure',
    synopsis: 'When modern potion brewing meets high fantasy system progression, one forgotten craft turns the tides of war.',
    rating: 4.95,
    views: '210K',
    chapters: 230,
    gradient: 'linear-gradient(135deg, #065f46, #10b981)',
  },
  {
    id: 4,
    title: 'Chronicles of the Broken Throne',
    author: 'Marcus Vance',
    genre: 'Epic Fantasy',
    synopsis: 'Seven kingdoms collide under the omen of the twin moons. Betrayal, honor, and ancient beasts awaken.',
    rating: 4.7,
    views: '86K',
    chapters: 64,
    gradient: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNovels = SAMPLE_NOVELS.filter((novel) =>
    novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    novel.genre.toLowerCase().includes(searchTerm.toLowerCase())
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
                <span className="novel-badge-tag">{novel.genre}</span>
                <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
              </div>
              <div className="novel-info">
                <h3 className="novel-title">{novel.title}</h3>
                <div className="novel-author">by {novel.author}</div>
                <p className="novel-synopsis">{novel.synopsis}</p>
                <div className="novel-stats">
                  <span className="novel-rating">★ {novel.rating}</span>
                  <span>{novel.chapters} Chs</span>
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
