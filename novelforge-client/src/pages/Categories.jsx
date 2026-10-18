import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const CATEGORIES = [
  {
    name: 'Fantasy & Cultivation',
    searchKey: 'Fantasy',
    count: '3 Featured Serials',
    icon: '🔮',
    desc: 'Cosmic ascension, martial sects, constellation spirits, and forgotten magical relics.',
  },
  {
    name: 'Sci-Fi & Cyberpunk',
    searchKey: 'Sci-Fi',
    count: '2 Featured Serials',
    icon: '🤖',
    desc: 'Neural consciousness networks, deep ocean abysses, AI hegemony, and high-tech dystopias.',
  },
  {
    name: 'LitRPG & Game Systems',
    searchKey: 'LitRPG',
    count: '1 Featured Serial',
    icon: '🎮',
    desc: 'Skill trees, potion compounding ratios, leveling milestones, and system prompts.',
  },
  {
    name: 'Epic Kingdoms & Intrigue',
    searchKey: 'Kingdoms',
    count: '1 Featured Serial',
    icon: '👑',
    desc: 'Dynastic betrayal, imperial succession wars, heraldry, and geopolitical strategy.',
  },
  {
    name: 'Engineering & Systems Architecture',
    searchKey: 'Distributed',
    count: '1 Guidebook',
    icon: '⚡',
    desc: 'Enterprise microservices, distributed data persistence, and reactive API Gateways.',
  },
  {
    name: 'Narrative Craft & Writing',
    searchKey: 'Craft',
    count: '1 Guidebook',
    icon: '✍️',
    desc: 'Serialized pacing, character tension loops, and digital reader engagement techniques.',
  },
];

const Categories = () => {
  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">📂 Explore Genres & Categories</h1>
          <p className="section-subtitle">Find your favorite storytelling worlds, tropes, and craft guides</p>
        </div>
      </div>

      <div className="features-grid">
        {CATEGORIES.map((cat, idx) => (
          <Link
            to={`/novels?search=${encodeURIComponent(cat.searchKey)}`}
            key={idx}
            className="feature-card"
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
            aria-label={`Explore ${cat.name} (${cat.count})`}
          >
            <div className="feature-icon-wrapper" style={{ fontSize: '1.75rem' }} aria-hidden="true">
              {cat.icon}
            </div>
            <h2 className="feature-title" style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>
              {cat.name}
            </h2>
            <p className="feature-desc" style={{ flex: 1, margin: 0 }}>
              {cat.desc}
            </p>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '1.25rem' }}>
              {cat.count} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
