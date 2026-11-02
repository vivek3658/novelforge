import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NovelCard from '../components/NovelCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { novelApi, engagementApi } from '../services/api';
import { Button, Input, Select, Pagination, EmptyState, Skeleton } from '../components/ui';

const GENRES = ['All', 'Fantasy', 'Cyberpunk', 'Sci-Fi', 'Xianxia', 'Action', 'Drama'];

export default function Novels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const genreParam = searchParams.get('genre') || '';
  const tagParam = searchParams.get('tag') || '';
  const pageParam = Number(searchParams.get('page') || 0);

  const [query, setQuery] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [genre, setGenre] = useState(genreParam);
  const [tag, setTag] = useState(tagParam);
  const [page, setPage] = useState(pageParam);
  const [showFilters, setShowFilters] = useState(Boolean(categoryParam || genreParam || tagParam));

  const [pageData, setPageData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedNovelIds, setSavedNovelIds] = useState(new Set());

  // Keep state in sync when URL search params change (e.g. from back/forward)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || '');
    setGenre(searchParams.get('genre') || '');
    setTag(searchParams.get('tag') || '');
    setPage(Number(searchParams.get('page') || 0));
  }, [searchParams]);

  const updateUrlParams = useCallback(
    (newParams) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              updated.set(k, String(v));
            } else {
              updated.delete(k);
            }
          });
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const fetchNovels = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await novelApi.searchNovels(query.trim(), page, 16, {
        category: category || undefined,
        genre: genre || undefined,
        tag: tag || undefined,
      });
      setPageData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      setErrorMessage(err.message || 'Could not load novels from catalog.');
    } finally {
      setLoading(false);
    }
  }, [query, page, category, genre, tag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNovels();
    }, query || genre || tag ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchNovels, query, genre, tag]);

  const handleSaveToLibrary = async (novel) => {
    if (!isAuthenticated) {
      toastError('Sign in to save a novel to your reading queue.');
      return;
    }
    try {
      await engagementApi.saveNovel(novel.id);
      setSavedNovelIds((prev) => new Set([...prev, novel.id]));
      success(`"${novel.title}" saved to your reading shelf.`);
    } catch (err) {
      toastError(err.message || 'Unable to save this novel.');
    }
  };

  const handleClearFilters = () => {
    setQuery('');
    setCategory('');
    setGenre('');
    setTag('');
    setPage(0);
    updateUrlParams({ q: '', category: '', genre: '', tag: '', page: 0 });
  };

  return (
    <section className="product-page">
      <header className="product-heading">
        <div>
          <p className="eyebrow">THE NOVEL CATALOG</p>
          <h1>Find your next favorite.</h1>
          <p>Search serialized fiction and nonfiction by title, genre, or mood.</p>
        </div>
        <Link className="quiet-button" to="/studio">
          Write with Studio <span aria-hidden="true">→</span>
        </Link>
      </header>

      {/* Hero Search Bar */}
      <div className="catalog-search-hero">
        <label className="catalog-search" htmlFor="catalog-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            id="catalog-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
              updateUrlParams({ q: e.target.value, page: 0 });
            }}
            placeholder="Search novels, authors, or genres…"
            aria-label="Search novels"
          />
        </label>
        <button
          type="button"
          className="catalog-filter-toggle"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
        >
          ☷ Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="catalog-filter-panel">
          <div className="catalog-filter">
            <Select
              label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
                updateUrlParams({ category: e.target.value, page: 0 });
              }}
            >
              <option value="">All categories</option>
              <option value="FICTION">Fiction</option>
              <option value="NONFICTION">Nonfiction</option>
            </Select>
          </div>
          <div className="catalog-filter">
            <Input
              label="Genre"
              placeholder="e.g. Fantasy, Cyberpunk"
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(0);
                updateUrlParams({ genre: e.target.value, page: 0 });
              }}
            />
          </div>
          <div className="catalog-filter">
            <Input
              label="Tag"
              placeholder="e.g. magic, cultivation"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(0);
                updateUrlParams({ tag: e.target.value, page: 0 });
              }}
            />
          </div>
          <Button variant="quiet" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Quick Genre Pills */}
      <div className="catalog-quick-genres" aria-label="Quick genre filters">
        {GENRES.filter((g) => g !== 'All').map((g) => {
          const isActive = genre.toLowerCase() === g.toLowerCase();
          return (
            <button
              type="button"
              key={g}
              className={isActive ? 'active' : ''}
              onClick={() => {
                const nextGenre = isActive ? '' : g;
                setGenre(nextGenre);
                setPage(0);
                updateUrlParams({ genre: nextGenre, page: 0 });
              }}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="error-banner" role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchNovels}>
            Try again
          </Button>
        </div>
      )}

      {/* Catalog Grid */}
      {loading ? (
        <div className="story-grid home-book-shelf">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Skeleton height="260px" borderRadius="14px" />
              <Skeleton height="18px" width="80%" />
              <Skeleton height="14px" width="55%" />
            </div>
          ))}
        </div>
      ) : pageData.content?.length > 0 ? (
        <div className="story-grid home-book-shelf">
          {pageData.content.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onSave={handleSaveToLibrary}
              saved={savedNovelIds.has(novel.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="No novels matched your search"
          description="Try adjusting your query, clearing filters, or exploring different genres."
          action={
            <Button variant="secondary" onClick={handleClearFilters}>
              Reset all filters
            </Button>
          }
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pageData.totalPages || 0}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          updateUrlParams({ page: nextPage });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </section>
  );
}
