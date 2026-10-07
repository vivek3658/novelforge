import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Home.css';

const Novels = () => {
  const { isAuthenticated, user, isCreator, convertToCreator } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Novel Form State (for both create and edit)
  const [formData, setFormData] = useState({
    title: '',
    categoryType: 'FICTION',
    synopsis: '',
  });

  // Fetch novels from novelStore
  const fetchNovels = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let result;
      if (query.trim().length > 0) {
        result = await novelStore.searchNovels(query.trim());
      } else {
        result = await novelStore.loadAllNovels(0);
      }
      setNovels(result.novels || []);
      setIsLiveConnected(Boolean(result.isLiveConnected));
    } catch (err) {
      console.warn('Failed to load novels:', err.message);
      setIsLiveConnected(false);
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

  // Filter novels by category
  const filteredNovels = novels.filter((n) => {
    if (categoryFilter === 'ALL') return true;
    return (n.categoryType || 'FICTION').toUpperCase() === categoryFilter.toUpperCase();
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      addToast('Please log in to publish a novel', 'error');
      navigate('/login');
      return;
    }
    setFormData({
      title: '',
      categoryType: 'FICTION',
      synopsis: '',
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (novel, e) => {
    if (e) e.stopPropagation();
    setSelectedNovel(novel);
    setFormData({
      title: novel.title || '',
      categoryType: novel.categoryType || 'FICTION',
      synopsis: novel.synopsis || '',
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (novel) => {
    setSelectedNovel(novel);
    setShowDetailModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (novel, e) => {
    if (e) e.stopPropagation();
    setSelectedNovel(novel);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  // Create Novel submit handler
  const handleCreateNovel = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.synopsis.trim()) {
      addToast('Please provide both title and synopsis', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const creatorName = user?.username || 'Author Unknown';
      const created = await novelStore.createNovel(formData, creatorName);
      addToast(`Novel "${created.title}" published successfully!`, 'success');
      setShowCreateModal(false);
      fetchNovels(search);
    } catch (err) {
      addToast(`Failed to publish: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Novel submit handler
  const handleUpdateNovel = async (e) => {
    e.preventDefault();
    if (!selectedNovel) return;
    if (!formData.title.trim() || !formData.synopsis.trim()) {
      addToast('Please provide both title and synopsis', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await novelStore.updateNovel(selectedNovel.id, formData);
      addToast(`Novel "${formData.title}" updated successfully!`, 'success');
      setShowEditModal(false);
      setSelectedNovel(null);
      fetchNovels(search);
    } catch (err) {
      addToast(`Failed to update novel: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Novel handler
  const handleDeleteNovel = async () => {
    if (!selectedNovel) return;

    setIsSubmitting(true);
    try {
      await novelStore.deleteNovel(selectedNovel.id);
      addToast(`Novel "${selectedNovel.title}" deleted successfully`, 'success');
      setShowDeleteModal(false);
      setSelectedNovel(null);
      fetchNovels(search);
    } catch (err) {
      addToast(`Failed to delete novel: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick become creator action
  const handleQuickBecomeCreator = async () => {
    setIsConverting(true);
    try {
      await convertToCreator();
      addToast('🎉 Upgraded to Creator! You can now publish and manage novels.', 'success');
      setShowCreateModal(true);
    } catch (err) {
      addToast(`Failed to convert: ${err.message}`, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Section */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className="section-title" style={{ margin: 0 }}>📚 Novel Directory</h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontWeight: 600,
                backgroundColor: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: isLiveConnected ? '#10b981' : '#818cf8',
                border: `1px solid ${isLiveConnected ? '#10b981' : '#818cf8'}`,
              }}
            >
              {isLiveConnected ? '● Live Backend Connected' : '○ Standby Catalog Mode'}
            </span>
          </div>
          <p className="section-subtitle">
            Explore serialized web novels, curated fiction & user-authored stories with live CRUD support
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            isCreator ? (
              <button
                onClick={handleOpenCreate}
                className="btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>+</span> Publish New Novel
              </button>
            ) : (
              <button
                onClick={handleQuickBecomeCreator}
                disabled={isConverting}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.92rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isConverting ? (
                  <>
                    <span className="spinner-sm"></span>
                    <span>Activating Creator...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Become Creator to Publish</span>
                  </>
                )}
              </button>
            )
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.92rem' }}
            >
              Log In to Publish
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '260px', maxWidth: '480px' }}>
          <input
            type="text"
            placeholder="Search novels by title, author, or synopsis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input no-icon"
            style={{ width: '100%' }}
          />
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'FICTION', label: 'Fiction' },
            { id: 'NONFICTION', label: 'Non-Fiction' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: categoryFilter === cat.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: categoryFilter === cat.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                color: categoryFilter === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spinner-sm" style={{ margin: '0 auto 1rem auto', width: '28px', height: '28px' }}></div>
          <p>Syncing novel catalog with backend services...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNovels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No novels found
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {search ? `No novels match your search query "${search}".` : 'Be the first author to publish a novel in this category!'}
          </p>
          {isAuthenticated && (
            <button onClick={handleOpenCreate} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
              + Publish New Novel
            </button>
          )}
        </div>
      )}

      {/* Novels Grid */}
      <div className="novels-grid">
        {filteredNovels.map((novel, idx) => (
          <article
            key={novel.id || idx}
            className="novel-card"
            onClick={() => handleOpenDetail(novel)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="novel-cover-placeholder"
              style={{ background: novel.gradient }}
            >
              <span className="novel-badge-tag">{novel.categoryType || 'FICTION'}</span>
              <span style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
            </div>

            <div className="novel-info">
              <h3 className="novel-title">{novel.title}</h3>
              <div className="novel-author">by {novel.author || 'Author Unknown'}</div>
              <p className="novel-synopsis">{novel.synopsis}</p>

              <div className="novel-stats">
                <span className="novel-rating">★ {novel.rating || '4.9'}</span>
                <span>{novel.chapters ? `${novel.chapters} Chs` : '0 Chs'}</span>
                <span>{novel.views || '1.2K'} reads</span>
              </div>

              {/* Action buttons on card for quick edit/delete if user is creator */}
              {(novel.isUserCreated || (user && novel.author === user.username)) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                  <button
                    onClick={(e) => handleOpenEdit(novel, e)}
                    className="action-btn-secondary"
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(novel, e)}
                    className="action-btn-secondary"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* DETAIL VIEW MODAL */}
      {showDetailModal && selectedNovel && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                background: selectedNovel.gradient,
                padding: '2.5rem 1.5rem',
                color: '#fff',
                position: 'relative',
                borderTopLeftRadius: 'var(--radius-lg)',
                borderTopRightRadius: 'var(--radius-lg)',
              }}
            >
              <button
                className="modal-close-btn"
                onClick={() => setShowDetailModal(false)}
                style={{ position: 'absolute', top: '12px', right: '12px', color: '#fff', background: 'rgba(0,0,0,0.3)' }}
              >
                ✕
              </button>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                {selectedNovel.categoryType || 'FICTION'}
              </span>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', fontWeight: 800 }}>{selectedNovel.title}</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                by <strong>{selectedNovel.author || 'Author Unknown'}</strong>
              </p>
            </div>

            <div className="modal-body">
              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Synopsis
                </h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedNovel.synopsis}
                </p>
              </div>

              {/* Chapter Information Banner */}
              <div className="chapter-alert-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  <span>📖</span>
                  <span>Chapters: 0 Published</span>
                </div>
                <p style={{ margin: 0 }}>
                  Novel chapter blocks and rich-text authoring are currently in development on the main branch. Metadata and synopsis are active with full CRUD operations.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div className="info-box" style={{ padding: '0.75rem' }}>
                  <div className="info-label">Rating</div>
                  <div className="info-value" style={{ color: '#f59e0b' }}>★ {selectedNovel.rating || '4.9'}</div>
                </div>
                <div className="info-box" style={{ padding: '0.75rem' }}>
                  <div className="info-label">Status</div>
                  <div className="info-value">Serialized</div>
                </div>
                <div className="info-box" style={{ padding: '0.75rem' }}>
                  <div className="info-label">Chapters</div>
                  <div className="info-value">0 (Coming Soon)</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.2rem' }}
              >
                Close
              </button>

              {(selectedNovel.isUserCreated || (user && selectedNovel.author === user.username)) && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(selectedNovel, e)}
                    className="action-btn-emerald"
                    style={{ padding: '0.55rem 1.25rem' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleOpenDelete(selectedNovel, e)}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NOVEL MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Publish New Novel</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateNovel}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Novel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Whispers of the Starforge"
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={formData.categoryType}
                    onChange={(e) => setFormData({ ...formData, categoryType: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="FICTION">Fiction</option>
                    <option value="NONFICTION">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Synopsis
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.synopsis}
                    onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                    placeholder="Provide a captivating overview or blurb for your novel..."
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div className="chapter-alert-box" style={{ fontSize: '0.82rem' }}>
                  ℹ️ Author is set to <strong>{user?.username || 'Author Unknown'}</strong>. Chapter authoring will unlock when chapter content service merges into main.
                </div>
              </div>

              <div className="modal-footer">
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
                  {isSubmitting ? 'Publishing...' : 'Publish Novel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOVEL MODAL */}
      {showEditModal && selectedNovel && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Novel</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateNovel}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Novel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={formData.categoryType}
                    onChange={(e) => setFormData({ ...formData, categoryType: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="FICTION">Fiction</option>
                    <option value="NONFICTION">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Synopsis
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.synopsis}
                    onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="action-btn-emerald"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedNovel && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Confirm Delete</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{selectedNovel.title}"</strong>?
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This will soft-delete the novel with a 30-day retention purge window on the server.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.2rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteNovel}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '0.55rem 1.4rem', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Novel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Novels;
