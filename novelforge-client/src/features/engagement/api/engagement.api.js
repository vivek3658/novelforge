/**
 * Engagement, Library & Reading Progress Feature API
 * Interacts with Engagement microservice through the API Gateway,
 * with reliable client-side caching fallback when service is offline.
 */

import { apiClient } from '../../../lib/api/client';

const LOCAL_BOOKMARKS_KEY = 'novelforge_bookmarks';
const LOCAL_PROGRESS_KEY = 'novelforge_reading_progress';

export const engagementApi = {
  /**
   * Get user bookmarks from server or local storage.
   */
  getBookmarks: async () => {
    try {
      return await apiClient('/api/v1/engagement/bookmarks', { method: 'GET' });
    } catch {
      // Local fallback
      try {
        const stored = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Add a novel to reading bookmarks.
   */
  addBookmark: async (novelId) => {
    try {
      return await apiClient('/api/v1/engagement/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ novelId }),
      });
    } catch {
      // Local fallback
      try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_BOOKMARKS_KEY) || '[]');
        if (!stored.includes(novelId)) {
          stored.push(novelId);
          localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(stored));
        }
      } catch (e) {
        console.warn('Local bookmark save failed:', e);
      }
      return { success: true, novelId };
    }
  },

  /**
   * Remove a novel from bookmarks.
   */
  removeBookmark: async (novelId) => {
    try {
      return await apiClient(`/api/v1/engagement/bookmarks/${novelId}`, {
        method: 'DELETE',
      });
    } catch {
      // Local fallback
      try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_BOOKMARKS_KEY) || '[]');
        const filtered = stored.filter((id) => id !== novelId);
        localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.warn('Local bookmark remove failed:', e);
      }
      return { success: true, novelId };
    }
  },

  /**
   * Save user reading progress (novel, chapter, percentage).
   */
  saveProgress: async ({ novelId, chapterId, percentage }) => {
    try {
      return await apiClient('/api/v1/engagement/progress', {
        method: 'POST',
        body: JSON.stringify({ novelId, chapterId, percentage }),
      });
    } catch {
      try {
        const key = `${LOCAL_PROGRESS_KEY}_${novelId}`;
        localStorage.setItem(
          key,
          JSON.stringify({ novelId, chapterId, percentage, timestamp: Date.now() })
        );
      } catch (e) {
        console.warn('Local progress save failed:', e);
      }
      return { success: true };
    }
  },
};

export default engagementApi;
