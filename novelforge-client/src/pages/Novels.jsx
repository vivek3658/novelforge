import React, { useState, useEffect, useCallback } from 'react';
import { novelApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Home.css';

const FALLBACK_CATALOG = [
  {
    id: 1,
    title: 'Shadows of the Astral Realm',
    author: 'Elena Vance',
    categoryType: 'FICTION',
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
    categoryType: 'FICTION',
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
    categoryType: 'FICTION',
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
    categoryType: 'FICTION',
    synopsis: 'Seven kingdoms collide under the omen of the twin moons. Betrayal, honor, and ancient beasts awaken.',
    rating: 4.7,
    views: '86K',
    chapters: 64,
    gradient: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  },
];

const GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  'linear-gradient(135deg, #065f46, #10b981)',
  'linear-gradient(135deg, #7c2d12, #ea580c)',
  'linear-gradient(135deg, #312e81, #6366f1)',
  'linear-gradient(135deg, #581c87, #c084fc)',
  'linear-gradient(135deg, #0f766e, #14b8a6)',
  'linear-gradient(135deg, #831843, #ec4899)',
];

const Novels = () => {
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Novel create form
  const [newTitle, setNewTitle] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newCategory, setNewCategory] = useState('FICTION');

  const fetchNovels = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let result;
      if (query.trim().length > 0) {
        result = await novelApi.searchNovels(query.trim());
      } else {
        result = await novelApi.getAllNovels(0);
      }

      // Spring Data Page returns { content: [...], totalElements: ... }
      const content = result && Array.isArray(result.content) ? result.content : (Array.isArray(result) ? result : []);
      if (content.length > 0) {
        setNovels(content);
        setIsLiveConnected(true);
      } else if (!query.trim()) {
        // If live DB is empty, show curated fallback with connection confirmed
        setNovels(FALLBACK_CATALOG);
        setIsLiveConnected(true);
      } else {
        setNovels([]);
      }
    } catch (err) {
      console.warn('Backend novel service fetch failed, using fallback:', err.message);
      setIsLiveConnected(false);
      setNovels(FALLBACK_CATALOG.filter(n =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.synopsis.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNovels(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchNovels]);

  const handleCreateNovel = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSynopsis.trim()) {
      addToast('Please provide both title and synopsis', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await novelApi.createNovel({
        title: newTitle.trim(),
        synopsis: newSynopsis.trim(),
        categoryType: newCategory,
      });

      addToast('Novel published successfully!', 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewSynopsis('');
      fetchNovels();
    } catch (err) {
      addToast(`Failed to publish: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="section-title" style={{ margin: 0 }}>📚 Novel Directory</h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontWeight: 600,
                backgroundColor: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isLiveConnected ? '#10b981' : '#f87171',
                border: `1px solid ${isLiveConnected ? '#10b981' : '#f87171'}`,
              }}
            >
              {isLiveConnected ? '● Live Service Connected' : '○ Standby Mode'}
            </span>
          </div>
          <p className="section-subtitle">Discover serialized web novels, light novels & original fiction</p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            + Publish New Novel
          </button>
        )}
      </div>

      <div style={{ maxWidth: '480px', marginBottom: '2.5rem' }}>
        <input
          type="text"
          placeholder="Filter novels by title or synopsis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input no-icon"
          style={{ width: '100%' }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #94a3b8)' }}>
          <p>Connecting to backend novel-service...</p>
        </div>
      )}

      {!loading && novels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #94a3b8)' }}>
          <p>No novels found matching "{search}".</p>
        </div>
      )}

      <div className="novels-grid">
        {novels.map((novel, idx) => (
          <article key={novel.id || idx} className="novel-card">
            <div
              className="novel-cover-placeholder"
              style={{ background: novel.gradient || GRADIENTS[idx % GRADIENTS.length] }}
            >
              <span className="novel-badge-tag">{novel.categoryType || novel.genre || 'FICTION'}</span>
              <span style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
            </div>
            <div className="novel-info">
              <h3 className="novel-title">{novel.title}</h3>
              <div className="novel-author">by {novel.author || 'NovelForge Author'}</div>
              <p className="novel-synopsis">{novel.synopsis}</p>
              <div className="novel-stats">
                <span className="novel-rating">★ {novel.rating || '4.9'}</span>
                <span>{novel.chapters || '12'} Chs</span>
                <span>{novel.views || '1.2K'} reads</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create Novel Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color, #334155)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem' }}>Publish New Novel</h2>
            <form onSubmit={handleCreateNovel}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Novel Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chronicles of the Void"
                  className="form-input no-icon"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input no-icon"
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  <option value="FICTION">Fiction</option>
                  <option value="NONFICTION">Non-Fiction</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Synopsis
                </label>
                <textarea
                  required
                  rows={4}
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="Brief summary of your novel..."
                  className="form-input no-icon"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Novels;
