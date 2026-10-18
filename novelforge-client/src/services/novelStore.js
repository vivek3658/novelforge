/**
 * Novel Store & Catalog Service
 * Production client store with explicit data isolation and live backend gateway synchronization:
 * - Real Backend Synchronization: Connects directly to Novel Service via API Gateway (GET /api/v1/novels)
 * - Local Drafts: Author work-in-progress drafts (isDraft: true, isPublished: false)
 * - Curated Catalog: Fallback showcase novels for reader demonstration while backend endpoints are under development
 */

import { DUMMY_NOVELS, NOVEL_GRADIENTS } from './dummyNovels';
import { novelApi } from './api';

const LOCAL_DRAFTS_KEY = 'novelforge_author_drafts';

export const getLocalAuthorDrafts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse local author drafts:', e);
    return [];
  }
};

export const saveLocalAuthorDrafts = (drafts) => {
  try {
    localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn('Failed to save local author drafts:', e);
  }
};

export const novelStore = {
  /**
   * Loads the complete novel catalog:
   * First queries the live backend API Gateway (/api/v1/novels).
   * If live backend novels exist, they are integrated directly.
   * If the service is under development (returns 404/offline), reports status honestly.
   */
  loadAllNovels: async () => {
    let isLiveBackendAvailable = false;
    let backendNovels = [];
    let backendStatusMessage = null;

    try {
      const res = await novelApi.getAllNovels({ page: 0 });
      const items = res?.content || (Array.isArray(res) ? res : []);
      if (items.length > 0) {
        backendNovels = items.map((novel, idx) => ({
          ...novel,
          isRemote: true,
          gradient: NOVEL_GRADIENTS[idx % NOVEL_GRADIENTS.length],
        }));
        isLiveBackendAvailable = true;
      } else {
        // Connected to backend, but catalog has no entries yet
        isLiveBackendAvailable = true;
      }
    } catch (err) {
      isLiveBackendAvailable = false;
      backendStatusMessage =
        err.status === 404
          ? 'Novel microservice endpoints are undergoing backend development.'
          : err.message || 'Novel microservice is currently unreachable.';
    }

    const authorDrafts = getLocalAuthorDrafts().map((draft, idx) => ({
      ...draft,
      isDraft: true,
      gradient: draft.gradient || NOVEL_GRADIENTS[idx % NOVEL_GRADIENTS.length],
    }));

    // Merge: backend novels + author drafts + curated showcase catalog
    const allNovels =
      backendNovels.length > 0
        ? [...authorDrafts, ...backendNovels]
        : [...authorDrafts, ...DUMMY_NOVELS];

    return {
      novels: allNovels,
      isLiveBackendAvailable,
      backendStatusMessage,
      curatedCount: DUMMY_NOVELS.length,
      draftCount: authorDrafts.length,
      remoteCount: backendNovels.length,
    };
  },

  /**
   * Search novels by keyword across titles, authors, genres, and synopses
   */
  searchNovels: async (query = '') => {
    const q = query.trim().toLowerCase();
    const { novels, isLiveBackendAvailable, backendStatusMessage } = await novelStore.loadAllNovels();

    if (!q) {
      return { novels, isLiveBackendAvailable, backendStatusMessage };
    }

    // Try backend search if available
    if (isLiveBackendAvailable) {
      try {
        const res = await novelApi.searchNovels({ query: q, page: 0 });
        const items = res?.content || (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          const remoteMatches = items.map((novel, idx) => ({
            ...novel,
            isRemote: true,
            gradient: NOVEL_GRADIENTS[idx % NOVEL_GRADIENTS.length],
          }));
          return { novels: remoteMatches, isLiveBackendAvailable, backendStatusMessage: null };
        }
      } catch (err) {
        console.warn('Backend search failed, falling back to local search:', err.message);
      }
    }

    const filtered = novels.filter((n) => {
      const matchTitle = n.title && n.title.toLowerCase().includes(q);
      const matchAuthor = n.author && n.author.toLowerCase().includes(q);
      const matchCategory = n.categoryType && n.categoryType.toLowerCase().includes(q);
      const matchGenre = n.genre && n.genre.toLowerCase().includes(q);
      const matchSynopsis = n.synopsis && n.synopsis.toLowerCase().includes(q);
      const matchTags = Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(q));

      return matchTitle || matchAuthor || matchCategory || matchGenre || matchSynopsis || matchTags;
    });

    return { novels: filtered, isLiveBackendAvailable, backendStatusMessage };
  },

  /**
   * Find a single novel by ID.
   * First checks local author drafts, then attempts remote backend fetch, then catalog.
   */
  getNovelById: async (id) => {
    const drafts = getLocalAuthorDrafts();
    const draft = drafts.find((d) => String(d.id) === String(id));
    if (draft) return draft;

    // Check remote backend if ID is a valid numeric ID
    if (/^\d+$/.test(String(id))) {
      try {
        const remoteNovel = await novelApi.getNovel(id);
        if (remoteNovel) {
          return {
            ...remoteNovel,
            isRemote: true,
            gradient: NOVEL_GRADIENTS[Number(id) % NOVEL_GRADIENTS.length],
          };
        }
      } catch {
        // Fall through to curated catalog
      }
    }

    const catalogNovel = DUMMY_NOVELS.find((n) => String(n.id) === String(id));
    return catalogNovel || null;
  },

  /**
   * Find a chapter by novel ID and chapter ID.
   */
  getChapter: async (novelId, chapterId) => {
    const novel = await novelStore.getNovelById(novelId);
    if (!novel || !Array.isArray(novel.chapters)) return null;

    const chapter = novel.chapters.find(
      (c) => String(c.id) === String(chapterId) || String(c.chapterNumber) === String(chapterId)
    );
    return chapter ? { novel, chapter } : null;
  },

  /**
   * Saves a novel draft in the author's local workspace.
   * Explicitly labeled as a Local Draft (isDraft: true).
   */
  saveDraft: async (draftData, authorUsername = 'Author') => {
    const drafts = getLocalAuthorDrafts();
    const isExisting = draftData.id && drafts.some((d) => String(d.id) === String(draftData.id));

    let updatedDraft;
    if (isExisting) {
      updatedDraft = {
        ...draftData,
        updatedAt: new Date().toISOString(),
        isDraft: true,
      };
      const updatedList = drafts.map((d) =>
        String(d.id) === String(draftData.id) ? updatedDraft : d
      );
      saveLocalAuthorDrafts(updatedList);
    } else {
      updatedDraft = {
        id: `draft-${Date.now()}`,
        title: draftData.title || 'Untitled Draft',
        author: authorUsername,
        categoryType: draftData.categoryType || 'FICTION',
        genre: draftData.genre || 'Original Fiction',
        synopsis: draftData.synopsis || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: true,
        chaptersCount: 0,
        chapters: [],
        rating: 5.0,
        views: '0',
        gradient: NOVEL_GRADIENTS[Math.floor(Math.random() * NOVEL_GRADIENTS.length)],
      };
      saveLocalAuthorDrafts([updatedDraft, ...drafts]);
    }

    return updatedDraft;
  },

  /**
   * Delete an author draft from local workspace
   */
  deleteDraft: async (draftId) => {
    const drafts = getLocalAuthorDrafts();
    const filtered = drafts.filter((d) => String(d.id) !== String(draftId));
    saveLocalAuthorDrafts(filtered);
    return true;
  },

  /**
   * Attempt publishing novel to backend service.
   * Transparently informs caller that backend NovelController endpoints are pending.
   */
  publishToBackend: async (draftData) => {
    // Attempt live POST /novels on the backend
    try {
      const created = await novelApi.createNovel({
        title: draftData.title,
        synopsis: draftData.synopsis,
        categoryType: draftData.categoryType || 'FICTION',
      });
      return { success: true, novel: created };
    } catch (err) {
      throw new Error(
        `Backend Novel Service is undergoing development (${err.message || 'HTTP 404'}). Your story is safely preserved in your author drafts.`
      );
    }
  },
};

export default novelStore;
