import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const CATEGORIES = [
  { name: 'Fantasy & Magic', count: '1,420 Novels', icon: '🔮', desc: 'Epic worlds, spellcasters, mythic kingdoms, and legendary artifacts.' },
  { name: 'Cultivation & Xianxia', count: '980 Novels', icon: '⚡', desc: 'Martial arts mastery, celestial ascension, qi condensation, and divine beasts.' },
  { name: 'Sci-Fi & Cyberpunk', count: '650 Novels', icon: '🤖', desc: 'Futuristic AI, cyberpunk dystopias, space exploration, and cyberware.' },
  { name: 'LitRPG & GameLit', count: '890 Novels', icon: '🎮', desc: 'Stats, leveling systems, dungeons, skill trees, and virtual reality.' },
  { name: 'Mystery & Thriller', count: '430 Novels', icon: '🕵️', desc: 'Supernatural investigations, dark mysteries, detectives, and suspense.' },
  { name: 'Romance & Drama', count: '760 Novels', icon: '💖', desc: 'Heartfelt journeys, historical romance, drama, and emotional bonds.' },
];

const Categories = () => {
  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">📂 Explore Genres & Categories</h1>
          <p className="section-subtitle">Find your favorite themes, worlds, and storytelling tropes</p>
        </div>
      </div>

      <div className="features-grid">
        {CATEGORIES.map((cat, idx) => (
          <Link
            to="/novels"
            key={idx}
            className="feature-card"
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
          >
            <div className="feature-icon-wrapper" style={{ fontSize: '1.75rem' }}>
              {cat.icon}
            </div>
            <h3 className="feature-title">{cat.name}</h3>
            <p className="feature-desc" style={{ flex: 1 }}>{cat.desc}</p>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '1rem' }}>
              {cat.count} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
