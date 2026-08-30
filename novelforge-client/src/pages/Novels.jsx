import React, { useState } from 'react';
import './Home.css';

const NOVELS_CATALOG = [
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
  {
    id: 5,
    title: 'Reincarnation of the Void Monarch',
    author: 'Jin Woo',
    genre: 'Action / Reincarnation',
    synopsis: 'Betrayed by the high gods, the Void Monarch awakens in the mortal realm as a disgraced count’s third son.',
    rating: 4.88,
    views: '175K',
    chapters: 195,
    gradient: 'linear-gradient(135deg, #312e81, #6366f1)',
  },
  {
    id: 6,
    title: 'Moonlight Necromancer',
    author: 'Seraphina Vale',
    genre: 'Dark Fantasy / System',
    synopsis: 'Given a forbidden dark class in a holy cathedral academy, she must summon shadows in secret to protect her realm.',
    rating: 4.82,
    views: '115K',
    chapters: 110,
    gradient: 'linear-gradient(135deg, #581c87, #c084fc)',
  },
  {
    id: 7,
    title: 'Infinite Dungeon Pioneer',
    author: 'Ren Takahashi',
    genre: 'Isekai / GameLit',
    synopsis: 'Trapped inside an ever-evolving floor labyrinth, only the most calculated strategies allow survival.',
    rating: 4.78,
    views: '92K',
    chapters: 104,
    gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
  },
  {
    id: 8,
    title: 'Whispers in the Ether',
    author: 'Cassandra Wright',
    genre: 'Mystery / Supernatural',
    synopsis: 'A Victorian detective with the ability to hear residual echoes of dead souls investigates high-society murders.',
    rating: 4.85,
    views: '67K',
    chapters: 52,
    gradient: 'linear-gradient(135deg, #831843, #ec4899)',
  },
];

const Novels = () => {
  const [search, setSearch] = useState('');

  const filtered = NOVELS_CATALOG.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.author.toLowerCase().includes(search.toLowerCase()) ||
      n.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">📚 Novel Directory</h1>
          <p className="section-subtitle">Discover serialized web novels, light novels & original fiction</p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', marginBottom: '2.5rem' }}>
        <input
          type="text"
          placeholder="Filter novels by title, author, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input no-icon"
          style={{ width: '100%' }}
        />
      </div>

      <div className="novels-grid">
        {filtered.map((novel) => (
          <article key={novel.id} className="novel-card">
            <div className="novel-cover-placeholder" style={{ background: novel.gradient }}>
              <span className="novel-badge-tag">{novel.genre}</span>
              <span style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
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
    </div>
  );
};

export default Novels;
