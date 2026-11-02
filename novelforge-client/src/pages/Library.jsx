import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import NovelCard from '../components/NovelCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { engagementApi, novelApi } from '../services/api';
import { Button, Input, EmptyState, Skeleton } from '../components/ui';

export default function Library() {
  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [rawItems, setRawItems] = useState([]);
  const [novels, setNovels] = useState([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch user's collections
  const loadCollections = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const [allCollections, watchLaterCollection] = await Promise.all([
        engagementApi.collections().catch(() => []),
        engagementApi.watchLater().catch(() => null),
      ]);
      const list = allCollections || [];
      setCollections(list);
      // Default to watch-later or first collection
      const initial = watchLaterCollection || list.find((c) => c.systemCollection) || list[0] || null;
      setSelectedCollection((prev) => prev || initial);
    } catch (err) {
      setErrorMessage(err.message || 'Could not load your library collections.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // 2. Fetch items for selected collection
  const loadCollectionItems = useCallback(async (collection) => {
    if (!collection) {
      setRawItems([]);
      setNovels([]);
      return;
    }
    setLoading(true);
    try {
      const res = await engagementApi.collectionItems(collection.id);
      const items = res?.content || [];
      setRawItems(items);

      // Resolve novel details for targetType === 'NOVEL'
      const novelPromises = items
        .filter((item) => item.targetType === 'NOVEL')
        .map(async (item) => {
          try {
            return await novelApi.getNovelById(item.targetId);
          } catch {
            return null;
          }
        });

      const loadedNovels = (await Promise.all(novelPromises)).filter(Boolean);
      setNovels(loadedNovels);
    } catch (err) {
      toastError(err.message || 'Could not load saved novels for this collection.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionItems(selectedCollection);
    }
  }, [selectedCollection, loadCollectionItems]);

  // 3. Search novels to add to collection
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      novelApi
        .searchNovels(searchQuery.trim(), 0, 6)
        .then((res) => setSearchResults(res?.content || []))
        .catch(() => setSearchResults([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const created = await engagementApi.createCollection({
        name: newCollectionName.trim(),
        description: '',
      });
      setNewCollectionName('');
      setIsCreatingCollection(false);
      await loadCollections();
      setSelectedCollection(created);
      success(`Collection "${created.name}" created!`);
    } catch (err) {
      toastError(err.message || 'Could not create collection.');
    }
  };

  const handleRemoveNovel = async (novel) => {
    if (!selectedCollection) return;
    const matchingItem = rawItems.find(
      (item) => item.targetType === 'NOVEL' && String(item.targetId) === String(novel.id)
    );

    try {
      if (selectedCollection.systemCollection) {
        await engagementApi.removeSaved('NOVEL', novel.id);
      } else if (matchingItem) {
        await engagementApi.removeCollectionItem(selectedCollection.id, matchingItem.id);
      }
      setNovels((prev) => prev.filter((n) => n.id !== novel.id));
      setRawItems((prev) =>
        prev.filter((item) => !(item.targetType === 'NOVEL' && String(item.targetId) === String(novel.id)))
      );
      success(`Removed "${novel.title}" from ${selectedCollection.name}.`);
    } catch (err) {
      toastError(err.message || 'Could not remove novel.');
    }
  };

  const handleAddNovel = async (novel) => {
    if (!selectedCollection) return;
    try {
      if (selectedCollection.systemCollection) {
        await engagementApi.saveNovel(novel.id);
      } else {
        await engagementApi.saveToCollection(selectedCollection.id, novel.id);
      }
      setSearchQuery('');
      setSearchResults([]);
      await loadCollectionItems(selectedCollection);
      success(`Added "${novel.title}" to ${selectedCollection.name}.`);
    } catch (err) {
      toastError(err.message || 'Could not add novel to this collection.');
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <section className="product-page" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            background: 'var(--bg-surface)',
            padding: '2.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Your Reading Shelf</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Sign in to build custom reading collections, save novels to your reading queue, and track your progress.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="ui-btn ui-btn-primary">
              Sign In
            </Link>
            <Link to="/novels" className="ui-btn ui-btn-secondary">
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-page">
      <header className="product-heading">
        <div>
          <p className="eyebrow">Your reading shelf</p>
          <h1>My library</h1>
          <p>Keep your saved novels together and build a shelf for every mood.</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreatingCollection((prev) => !prev)}>
          ＋ New collection
        </Button>
      </header>

      {/* Inline Collection Creator Form */}
      {isCreatingCollection && (
        <form
          className="collection-create"
          onSubmit={handleCreateCollection}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}
        >
          <div style={{ flex: 1 }}>
            <Input
              label="Collection name"
              autoFocus
              maxLength={80}
              required
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. Weekend Binge, Favorites"
            />
          </div>
          <Button type="submit" variant="primary">
            Create
          </Button>
          <Button variant="quiet" onClick={() => setIsCreatingCollection(false)}>
            Cancel
          </Button>
        </form>
      )}

      {errorMessage && (
        <div className="error-banner" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="library-layout">
        {/* Collections Sidebar */}
        <aside>
          <h2 className="sidebar-label" style={{ fontSize: '0.9rem', marginBottom: '0.6rem' }}>
            Collections
          </h2>
          <div className="collection-list">
            {collections.map((col) => {
              const isSelected = selectedCollection?.id === col.id;
              return (
                <button
                  type="button"
                  key={col.id}
                  className={`collection-link ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCollection(col)}
                >
                  <span>{col.name}</span>
                  <small>{col.itemCount ?? 0}</small>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Collection Content */}
        <div className="library-content">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Current shelf</p>
              <h2>{selectedCollection?.name || 'Saved novels'}</h2>
            </div>
          </div>

          {/* Search to add novel */}
          {selectedCollection && (
            <div className="library-add" style={{ marginBottom: '1.5rem' }}>
              <Input
                label="Add a novel to this shelf"
                placeholder="Search catalog by title to add…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="library-matches">
                  {searchResults.map((n) => (
                    <div key={n.id}>
                      <span>
                        <strong>{n.title}</strong>
                        <small>{n.categoryType}</small>
                      </span>
                      <Button variant="quiet" size="sm" onClick={() => handleAddNovel(n)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Novel Grid */}
          {loading ? (
            <div className="story-grid home-book-shelf">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <Skeleton height="260px" borderRadius="14px" />
                  <Skeleton height="18px" width="80%" />
                </div>
              ))}
            </div>
          ) : novels.length > 0 ? (
            <div className="story-grid home-book-shelf">
              {novels.map((novel) => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  onSave={() => handleRemoveNovel(novel)}
                  saved={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📚"
              title="This shelf is waiting for a novel"
              description="Search above or browse the catalog to add a novel you want to come back to."
              action={
                <Link to="/novels" className="ui-btn ui-btn-primary">
                  Discover novels
                </Link>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
