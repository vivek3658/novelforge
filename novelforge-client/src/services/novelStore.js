// Unified Novel Store for NovelForge Client
// Integrates live backend novel-service CRUD with fallback dummy novels and local storage cache.

import { novelApi } from './api';
import { DUMMY_NOVELS, NOVEL_GRADIENTS } from './dummyNovels';

const LOCAL_NOVELS_KEY = 'novelforge_user_novels';

export const getLocalUserNovels = () => {
  try {
    const raw = localStorage.getItem(LOCAL_NOVELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse local user novels:', e);
    return [];
  }
};

export const saveLocalUserNovels = (novels) => {
  try {
    localStorage.setItem(LOCAL_NOVELS_KEY, JSON.stringify(novels));
  } catch (e) {
    console.warn('Failed to save local user novels:', e);
  }
};

/**
 * Normalizes novel data from backend or local storage into a consistent frontend model.
 */
export const normalizeNovel = (novel, idx = 0) => {
  return {
    id: novel.id,
    title: novel.title || 'Untitled Novel',
    synopsis: novel.synopsis || 'No synopsis provided.',
    categoryType: novel.categoryType || 'FICTION',
    author: novel.author || 'Author Unknown',
    chapters: novel.chapters ?? 0,
    chapterStatus: novel.chapterStatus || (novel.chapters ? `${novel.chapters} Chapters` : 'No chapters published yet'),
    rating: novel.rating || 4.9,
    views: novel.views || '1.2K',
    createdAt: novel.createdAt || new Date().toISOString(),
    updatedAt: novel.updatedAt || new Date().toISOString(),
    gradient: novel.gradient || NOVEL_GRADIENTS[idx % NOVEL_GRADIENTS.length],
    isLive: Boolean(novel.isLive),
    isUserCreated: Boolean(novel.isUserCreated),
  };
};

export const novelStore = {
  /**
   * Fetches all novels: tries backend novel-service first,
   * then merges live novels, user-created novels, and curated dummy novels.
   */
  loadAllNovels: async (page = 0) => {
    let liveNovels = [];
    let isLiveConnected = false;

    try {
      const response = await novelApi.getAllNovels(page);
      const content = response && Array.isArray(response.content)
        ? response.content
        : (Array.isArray(response) ? response : []);

      if (content.length > 0) {
        liveNovels = content.map((item, idx) => ({
          ...normalizeNovel(item, idx),
          isLive: true,
          author: item.author || 'Author Unknown',
          chapters: 0,
          chapterStatus: 'No chapters published yet',
        }));
        isLiveConnected = true;
      } else {
        isLiveConnected = true;
      }
    } catch (err) {
      console.warn('Live novel-service currently unavailable, using catalog store:', err.message);
      isLiveConnected = false;
    }

    const userNovels = getLocalUserNovels().map((item, idx) => ({
      ...normalizeNovel(item, idx),
      isUserCreated: true,
    }));

    // Avoid duplicates if a novel is in both live and local
    const liveIds = new Set(liveNovels.map((n) => String(n.id)));
    const filteredUserNovels = userNovels.filter((n) => !liveIds.has(String(n.id)));

    // Combined catalog: User created + Live backend + Dummy novels
    const combined = [...filteredUserNovels, ...liveNovels, ...DUMMY_NOVELS];

    return {
      novels: combined,
      isLiveConnected,
      liveCount: liveNovels.length,
      userCount: filteredUserNovels.length,
    };
  },

  /**
   * Searches novels by keyword (title, synopsis, category)
   */
  searchNovels: async (query = '', page = 0) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return await novelStore.loadAllNovels(page);
    }

    let liveNovels = [];
    let isLiveConnected = false;

    try {
      const response = await novelApi.searchNovels(q, page);
      const content = response && Array.isArray(response.content)
        ? response.content
        : (Array.isArray(response) ? response : []);

      if (content.length > 0) {
        liveNovels = content.map((item, idx) => ({
          ...normalizeNovel(item, idx),
          isLive: true,
          author: item.author || 'Author Unknown',
          chapters: 0,
        }));
        isLiveConnected = true;
      }
    } catch {
      isLiveConnected = false;
    }

    const userNovels = getLocalUserNovels();
    const allFallback = [...userNovels, ...DUMMY_NOVELS];
    const filteredFallback = allFallback.filter((n) =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.synopsis && n.synopsis.toLowerCase().includes(q)) ||
      (n.categoryType && n.categoryType.toLowerCase().includes(q))
    );

    const liveIds = new Set(liveNovels.map((n) => String(n.id)));
    const merged = [...liveNovels, ...filteredFallback.filter((n) => !liveIds.has(String(n.id)))];

    return {
      novels: merged,
      isLiveConnected,
    };
  },

  /**
   * Creates a novel: attempts POST /novels on novel-service,
   * also caches in local storage for instantaneous display.
   */
  createNovel: async (data, creatorUsername = 'Author Unknown') => {
    let createdResult = null;
    let isLive = false;

    try {
      createdResult = await novelApi.createNovel({
        title: data.title,
        synopsis: data.synopsis,
        categoryType: data.categoryType,
      });
      isLive = true;
    } catch (err) {
      console.warn('Backend createNovel failed or timed out, caching locally:', err.message);
      // Fallback local creation with synthetic ID
      createdResult = {
        id: Date.now(),
        title: data.title,
        synopsis: data.synopsis,
        categoryType: data.categoryType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const newNovel = {
      ...normalizeNovel(createdResult),
      author: creatorUsername || 'Author Unknown',
      chapters: 0,
      chapterStatus: 'No chapters published yet',
      isLive,
      isUserCreated: true,
      gradient: NOVEL_GRADIENTS[Math.floor(Math.random() * NOVEL_GRADIENTS.length)],
    };

    const existing = getLocalUserNovels();
    saveLocalUserNovels([newNovel, ...existing]);

    return newNovel;
  },

  /**
   * Updates an existing novel by ID: attempts PUT /novels/{id},
   * and updates local store.
   */
  updateNovel: async (id, data) => {
    let isLive = false;
    try {
      await novelApi.updateNovel(id, {
        title: data.title,
        synopsis: data.synopsis,
        categoryType: data.categoryType,
      });
      isLive = true;
    } catch (err) {
      console.warn('Backend updateNovel failed, updating local copy:', err.message);
    }

    // Update in local user novels if exists
    const existing = getLocalUserNovels();
    const updated = existing.map((n) => {
      if (String(n.id) === String(id)) {
        return {
          ...n,
          title: data.title,
          synopsis: data.synopsis,
          categoryType: data.categoryType,
          updatedAt: new Date().toISOString(),
          isLive: isLive || n.isLive,
        };
      }
      return n;
    });
    saveLocalUserNovels(updated);

    return { id, ...data, updatedAt: new Date().toISOString(), isLive };
  },

  /**
   * Deletes a novel by ID: attempts DELETE /novels/{id},
   * and removes from local store.
   */
  deleteNovel: async (id) => {
    try {
      await novelApi.deleteNovel(id);
    } catch (err) {
      console.warn('Backend deleteNovel failed or offline, removing from local state:', err.message);
    }

    const existing = getLocalUserNovels();
    const filtered = existing.filter((n) => String(n.id) !== String(id));
    saveLocalUserNovels(filtered);

    return true;
  },
};

export default novelStore;
