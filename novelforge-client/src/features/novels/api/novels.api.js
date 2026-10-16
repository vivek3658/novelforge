/**
 * Novel Discovery & Catalog Feature API
 * Communicates with Novel Service through the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const novelApi = {
  /**
   * Probe live backend novel service availability.
   */
  checkServiceAvailability: async () => {
    try {
      const res = await apiClient(ENDPOINTS.NOVELS.BASE, {
        method: 'GET',
        timeoutMs: 5000,
      });
      return { isAvailable: true, data: res };
    } catch (err) {
      return { isAvailable: false, error: err.message, status: err.status };
    }
  },

  /**
   * Fetch paginated novels catalog from gateway.
   */
  getAllNovels: async ({ page = 0 } = {}) => {
    return apiClient(`${ENDPOINTS.NOVELS.BASE}?page=${page}`, {
      method: 'GET',
    });
  },

  /**
   * Search published novels by title, author, or keyword.
   */
  searchNovels: async ({ query = '', page = 0 } = {}) => {
    return apiClient(
      `${ENDPOINTS.NOVELS.SEARCH}?query=${encodeURIComponent(query)}&page=${page}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get single novel details by novelId.
   */
  getNovel: async (novelId) => {
    return apiClient(ENDPOINTS.NOVELS.DETAIL(novelId), {
      method: 'GET',
    });
  },

  /**
   * Create a new novel.
   * Payload: { title, synopsis, categoryType: 'FICTION' | 'NONFICTION' }
   */
  createNovel: async ({ title, synopsis, categoryType = 'FICTION' }) => {
    return apiClient(ENDPOINTS.NOVELS.BASE, {
      method: 'POST',
      body: JSON.stringify({ title, synopsis, categoryType }),
    });
  },

  /**
   * Update existing novel metadata.
   */
  updateNovel: async (novelId, { title, synopsis, categoryType }) => {
    return apiClient(ENDPOINTS.NOVELS.DETAIL(novelId), {
      method: 'PUT',
      body: JSON.stringify({ title, synopsis, categoryType }),
    });
  },

  /**
   * Delete novel by ID.
   */
  deleteNovel: async (novelId) => {
    return apiClient(ENDPOINTS.NOVELS.DETAIL(novelId), {
      method: 'DELETE',
    });
  },
};

export default novelApi;
