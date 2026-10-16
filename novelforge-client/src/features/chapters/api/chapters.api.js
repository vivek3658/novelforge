/**
 * Chapter Content & Reading Feature API
 * Communicates with Novel & Chapter Service through the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const chaptersApi = {
  /**
   * Fetch all chapters for a given novel.
   */
  getChapters: async (novelId) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters`, {
      method: 'GET',
    });
  },

  /**
   * Get full chapter text and metadata for the reading view.
   */
  getChapter: async (novelId, chapterId) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new chapter for an author's novel.
   */
  createChapter: async (novelId, { title, content, sequenceOrder }) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ title, content, sequenceOrder }),
    });
  },

  /**
   * Update chapter content.
   */
  updateChapter: async (novelId, chapterId, { title, content }) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
  },
};

export default chaptersApi;
