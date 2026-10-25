import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

const params = (values) => new URLSearchParams(Object.entries(values).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));

export const engagementApi = {
  getCollections: () => apiClient(ENDPOINTS.ENGAGEMENT.COLLECTIONS),
  createCollection: (data) => apiClient(ENDPOINTS.ENGAGEMENT.COLLECTIONS, { method: 'POST', body: JSON.stringify(data) }),
  renameCollection: (id, data) => apiClient(`/api/v1/engagement/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id) => apiClient(`/api/v1/engagement/collections/${id}`, { method: 'DELETE' }),
  getCollectionItems: (id, { page = 0, size = 20 } = {}) => apiClient(`${ENDPOINTS.ENGAGEMENT.COLLECTION_ITEMS(id)}?${params({ page, size })}`),
  saveToCollection: (id, targetType, targetId) => apiClient(ENDPOINTS.ENGAGEMENT.COLLECTION_ITEMS(id), { method: 'PUT', body: JSON.stringify({ targetType, targetId: String(targetId) }) }),
  removeCollectionItem: (collectionId, itemId) => apiClient(`${ENDPOINTS.ENGAGEMENT.COLLECTION_ITEMS(collectionId)}/${itemId}`, { method: 'DELETE' }),
  getWatchLater: () => apiClient(ENDPOINTS.ENGAGEMENT.WATCH_LATER),
  watchLaterContains: (targetType, targetId) => apiClient(`${ENDPOINTS.ENGAGEMENT.WATCH_LATER}/contains?${params({ targetType, targetId })}`),
  saveForLater: (targetType, targetId) => apiClient(ENDPOINTS.ENGAGEMENT.WATCH_LATER_ITEMS, { method: 'PUT', body: JSON.stringify({ targetType, targetId: String(targetId) }) }),
  removeFromWatchLater: (targetType, targetId) => apiClient(`${ENDPOINTS.ENGAGEMENT.WATCH_LATER_ITEMS}?${params({ targetType, targetId })}`, { method: 'DELETE' }),
  getPosts: ({ page = 0, size = 20 } = {}) => apiClient(`${ENDPOINTS.ENGAGEMENT.PUBLIC_POSTS}?${params({ page, size })}`),
  getFeed: ({ cursor, size = 20 } = {}) => apiClient(`${ENDPOINTS.ENGAGEMENT.FEED}?${params({ cursor, size })}`),
  getComments: (type, id, { page = 0, size = 20 } = {}) => apiClient(`${ENDPOINTS.ENGAGEMENT.BASE}/targets/${type}/${id}/comments?${params({ page, size })}`),
  addComment: (type, id, content) => apiClient(`${ENDPOINTS.ENGAGEMENT.BASE}/targets/${type}/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  like: (type, id) => apiClient(`${ENDPOINTS.ENGAGEMENT.BASE}/targets/${type}/${id}/likes`, { method: 'POST' }),
  unlike: (type, id) => apiClient(`${ENDPOINTS.ENGAGEMENT.BASE}/targets/${type}/${id}/likes`, { method: 'DELETE' }),
  createPost: (data) => apiClient(`${ENDPOINTS.ENGAGEMENT.BASE}/posts`, { method: 'POST', body: JSON.stringify(data) }),
};

export default engagementApi;
