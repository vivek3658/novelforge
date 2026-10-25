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

  getStudioChapters: async (studioId, novelId, { page = 0, size = 100 } = {}) => {
    return apiClient(`/api/v1/studios/${studioId}/novels/${novelId}/chapters?page=${page}&size=${size}`, { method: 'GET' });
  },

  /**
   * Get full chapter text and metadata for the reading view.
   */
  getChapter: async (novelId, chapterId) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}`, {
      method: 'GET',
    });
  },

  getStudioChapter: (studioId, novelId, chapterId) => apiClient(`/api/v1/studios/${studioId}/novels/${novelId}/chapters/${chapterId}`, { method: 'GET' }),

  /**
   * Create a new chapter for an author's novel.
   */
  createChapter: async (novelId, { title, chapterNumber }) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ title, chapterNumber }),
    });
  },

  /**
   * Update chapter content.
   */
  updateChapter: async (novelId, chapterId, { title, content }) => {
    return apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, content }),
    });
  },

  addBlock: async (novelId, chapterId, block) => apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}/blocks`, { method: 'POST', body: JSON.stringify(block) }),
  updateBlock: async (novelId, chapterId, blockId, block) => apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}/blocks/${blockId}`, { method: 'PUT', body: JSON.stringify(block) }),
  publishChapter: async (novelId, chapterId) => apiClient(`${ENDPOINTS.NOVELS.DETAIL(novelId)}/chapters/${chapterId}/publish`, { method: 'POST' }),
};

export default chaptersApi;
