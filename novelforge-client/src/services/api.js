export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    const isLocal = trimmed.includes('localhost') || trimmed.includes('127.0.0.1');
    trimmed = `${isLocal ? 'http://' : 'https://'}${trimmed}`;
  }
  return trimmed;
};

export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  return normalizeUrl(envUrl || 'http://localhost:8080');
};

export const resolveEndpoint = (endpoint) => {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint;
  }
  if (
    endpoint.startsWith('/auth') ||
    endpoint.startsWith('/register') ||
    endpoint.startsWith('/user-profile') ||
    endpoint.startsWith('/profile') ||
    endpoint.startsWith('/account')
  ) {
    return `/api/v1/identity${endpoint}`;
  }
  if (
    endpoint.startsWith('/studios') ||
    endpoint.startsWith('/engagement') ||
    endpoint.startsWith('/novels') ||
    endpoint.startsWith('/notifications')
  ) {
    return `/api/v1${endpoint}`;
  }
  if (endpoint.startsWith('/admin') || endpoint.startsWith('/moderation')) {
    return `/api/v1/identity${endpoint}`;
  }
  return endpoint;
};

const refreshState = { promise: null };
const refreshAccessToken = () => {
  if (!refreshState.promise) {
    refreshState.promise = fetch(`${getBaseUrl()}/api/v1/identity/auth/refresh`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Your session has expired. Please sign in again.');
      if (data.accessToken) localStorage.setItem('novelforge_access_token', data.accessToken);
      return data;
    }).catch((error) => {
      localStorage.removeItem('novelforge_access_token');
      localStorage.removeItem('novelforge_user');
      throw error;
    }).finally(() => { refreshState.promise = null; });
  }
  return refreshState.promise;
};

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const resolvedEndpoint = resolveEndpoint(endpoint);
  const url = `${baseUrl}${resolvedEndpoint}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const isAuthFlow =
    resolvedEndpoint.includes('/auth/refresh') ||
    resolvedEndpoint.includes('/auth/login') ||
    resolvedEndpoint.includes('/register') ||
    resolvedEndpoint.includes('/auth/forgot-password');

  const token = !options.noAuth && !isAuthFlow ? (options.token || localStorage.getItem('novelforge_access_token')) : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const timeoutMs = options.timeoutMs || 20000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    headers,
    signal: options.signal || controller.signal,
    credentials: 'include',
  };

  try {
    let response;
    try {
      response = await fetch(url, config);
    } finally {
      clearTimeout(timer);
    }

    if (
      response.status === 401 &&
      !isAuthFlow && !options.noAuth && !options._skipRefresh &&
      !options._isRetry
    ) {
      try {
        const refreshRes = await refreshAccessToken();
        if (refreshRes && refreshRes.accessToken) {
          return await apiRequest(endpoint, {
            ...options,
            token: refreshRes.accessToken,
            headers: { ...headers, Authorization: `Bearer ${refreshRes.accessToken}` },
            _isRetry: true,
          });
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('novelforge_access_token');
          localStorage.removeItem('novelforge_user');
        }
      }
    }

    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let message = 'An error occurred';
      if (typeof data === 'string' && data.trim().length > 0) {
        message = data;
      } else if (data && typeof data === 'object') {
        message = data.message || data.error || data.details || JSON.stringify(data);
      }
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`The service did not respond within ${timeoutMs / 1000} seconds. Please try again.`);
    }
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(`Unable to reach backend gateway at ${baseUrl}. Ensure services are awake and network is reachable.`);
    }
    throw err;
  }
}

export const authApi = {
  sendRegisterOtp: async (email) =>
    apiRequest('/register/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyRegisterOtp: async (email, otp) =>
    apiRequest('/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  register: async (userData) =>
    apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: async (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  refreshToken: async () => refreshAccessToken(),

  getMe: async (token) =>
    apiRequest('/auth/me', {
      method: 'GET',
      token,
    }),

  getProfile: (token) =>
    apiRequest('/profile/me', {
      method: 'GET',
      ...(token ? { token } : {}),
    }),

  updateProfile: (profileData) =>
    apiRequest('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    }),

  logout: async () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  forgotPasswordSendOtp: async (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPasswordVerifyOtp: async (email, otp) =>
    apiRequest('/auth/forgot-password/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  forgotPasswordReset: async (email, newPassword) =>
    apiRequest('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  becomeAuthor: () =>
    apiRequest('/profile/creator', {
      method: 'POST',
    }),
};

export const novelApi = {
  getAllNovels: (page = 0, size = 16) =>
    apiRequest(`/novels/search?page=${page}&size=${size}`, { method: 'GET', noAuth: true }),

  searchNovels: (query = '', page = 0, size = 16, filters = {}) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    if (filters.category) params.set('category', filters.category);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.tag) params.set('tag', filters.tag);
    return apiRequest(`/novels/search?${params.toString()}`, { method: 'GET', noAuth: true });
  },

  getNovelById: async (id) =>
    apiRequest(`/novels/${id}`, { method: 'GET', noAuth: true }),

  cancelDeletion: (id) => apiRequest(`/novels/${id}/deletion/cancel`, { method: 'POST' }),

  createNovel: async (data) =>
    apiRequest(`/novels/studios/${data.studioId}/novels`, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'studioId'))),
    }),

  updateNovel: async (id, data) =>
    apiRequest(`/novels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNovel: async (id) =>
    apiRequest(`/novels/${id}`, { method: 'DELETE' }),
};

export const chaptersApi = {
  listPublic: (novelId, page = 0, size = 20) =>
    apiRequest(`/novels/${novelId}/chapters?page=${page}&size=${size}`, { method: 'GET', noAuth: true }),

  getPublic: (novelId, chapterId) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}`, { method: 'GET', noAuth: true }),

  listForStudio: (studioId, novelId, page = 0, size = 20) =>
    apiRequest(`/novels/studios/${studioId}/novels/${novelId}/chapters?page=${page}&size=${size}`, { method: 'GET' }),

  getForStudio: (studioId, novelId, chapterId) =>
    apiRequest(`/novels/studios/${studioId}/novels/${novelId}/chapters/${chapterId}`, { method: 'GET' }),

  create: (novelId, chapterData) =>
    apiRequest(`/novels/${novelId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(chapterData),
    }),

  addBlock: (novelId, chapterId, blockData) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(blockData),
    }),

  updateBlock: (novelId, chapterId, blockId, blockData) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(blockData),
    }),

  deleteBlock: (novelId, chapterId, blockId) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/blocks/${blockId}`, {
      method: 'DELETE',
    }),

  deleteChapter: (novelId, chapterId) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}`, { method: 'DELETE' }),

  updateChapter: (novelId, chapterId, updateData) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),

  publish: (novelId, chapterId) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/publish`, { method: 'POST' }),

  schedule: (novelId, chapterId, publishAt) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ publishAt }),
    }),

  cancelSchedule: (novelId, chapterId) =>
    apiRequest(`/novels/${novelId}/chapters/${chapterId}/schedule`, { method: 'DELETE' }),
};

export const studioApi = {
  mine: () => apiRequest('/studios/me', { method: 'GET' }),

  search: (query = '', page = 0, size = 12) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    return apiRequest(`/studios?${params.toString()}`, { method: 'GET' });
  },

  create: (studioData) =>
    apiRequest('/studios', {
      method: 'POST',
      body: JSON.stringify(studioData),
    }),

  get: (studioId) => apiRequest(`/studios/${studioId}`, { method: 'GET' }),

  update: (studioId, data) => apiRequest(`/studios/${studioId}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (studioId) => apiRequest(`/studios/${studioId}`, { method: 'DELETE' }),

  cancelDeletion: (studioId) => apiRequest(`/studios/${studioId}/deletion/cancel`, { method: 'POST' }),

  acceptInvitation: (membershipId) => apiRequest(`/studios/invitations/${membershipId}/accept`, { method: 'POST' }),

  updateMemberRole: (studioId, userId, role) => apiRequest(`/studios/${studioId}/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  removeMember: (studioId, userId) => apiRequest(`/studios/${studioId}/members/${userId}`, { method: 'DELETE' }),

  membership: (studioId) =>
    apiRequest(`/studios/${studioId}/membership`, { method: 'GET' }),

  getMembers: (studioId, page = 0, size = 20) =>
    apiRequest(`/studios/${studioId}/members?page=${page}&size=${size}`, { method: 'GET' }),

  inviteMember: (studioId, inviteData) =>
    apiRequest(`/studios/${studioId}/members`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    }),

  createNovel: (studioId, novelData) =>
    apiRequest(`/novels/studios/${studioId}/novels`, {
      method: 'POST',
      body: JSON.stringify(novelData),
    }),

  listNovels: (studioId, page = 0) =>
    apiRequest(`/novels/studios/${studioId}/novels?page=${page}&size=20`, { method: 'GET' }),

  novels: (studioId, page = 0) =>
    apiRequest(`/novels/studios/${studioId}/novels?page=${page}&size=20`, { method: 'GET' }),

  publishNovel: (novelId) =>
    apiRequest(`/novels/${novelId}/publish`, { method: 'POST' }),

  updateNovel: (novelId, data) =>
    apiRequest(`/novels/${novelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNovel: (novelId) =>
    apiRequest(`/novels/${novelId}`, { method: 'DELETE' }),
};

export const engagementApi = {
  collections: () => apiRequest('/engagement/collections', { method: 'GET' }),

  watchLater: () => apiRequest('/engagement/collections/watch-later', { method: 'GET' }),

  collectionItems: (collectionId, page = 0) =>
    apiRequest(`/engagement/collections/${collectionId}/items?page=${page}&size=40`, { method: 'GET' }),

  createCollection: (data) =>
    apiRequest('/engagement/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCollection: (collectionId, data) => apiRequest(`/engagement/collections/${collectionId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCollection: (collectionId) => apiRequest(`/engagement/collections/${collectionId}`, { method: 'DELETE' }),

  collectionContains: (targetType, targetId) => apiRequest(`/engagement/collections/watch-later/contains?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`, { method: 'GET' }),

  saveToCollection: (collectionId, novelId) =>
    apiRequest(`/engagement/collections/${collectionId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ targetType: 'NOVEL', targetId: String(novelId) }),
    }),

  saveItemToCollection: (collectionId, targetType, targetId) => apiRequest(`/engagement/collections/${collectionId}/items`, { method: 'PUT', body: JSON.stringify({ targetType, targetId: String(targetId) }) }),

  removeCollectionItem: (collectionId, itemId) =>
    apiRequest(`/engagement/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' }),

  saveNovel: (novelId) =>
    apiRequest('/engagement/collections/watch-later/items', {
      method: 'PUT',
      body: JSON.stringify({ targetType: 'NOVEL', targetId: String(novelId) }),
    }),

  removeSaved: (targetType, targetId) =>
    apiRequest(`/engagement/collections/watch-later/items?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
    }),

  posts: (page = 0) =>
    apiRequest(`/engagement/public/posts?page=${page}&size=20`, { method: 'GET', noAuth: true }),

  createPost: (postData) =>
    apiRequest('/engagement/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),

  comments: (targetType, targetId, page = 0) =>
    apiRequest(`/engagement/targets/${targetType}/${targetId}/comments?page=${page}&size=20`, { method: 'GET', noAuth: true }),

  addComment: (targetType, targetId, content) =>
    apiRequest(`/engagement/targets/${targetType}/${targetId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  editComment: (commentId, content) => apiRequest(`/engagement/comments/${commentId}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  deleteComment: (commentId) => apiRequest(`/engagement/comments/${commentId}`, { method: 'DELETE' }),

  follow: (type, targetId) => apiRequest(`/engagement/follows/${type}/${targetId}`, { method: 'PUT' }),

  unfollow: (type, targetId) => apiRequest(`/engagement/follows/${type}/${targetId}`, { method: 'DELETE' }),

  followed: () => apiRequest('/engagement/follows/me', { method: 'GET' }),

  followerCount: (type, targetId) => apiRequest(`/engagement/follows/${type}/${targetId}/count`, { method: 'GET', noAuth: true }),

  feed: (cursor = '', size = 20) => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursor) params.set('cursor', cursor);
    return apiRequest(`/engagement/feed?${params}`, { method: 'GET' });
  },

  like: (targetType, targetId) =>
    apiRequest(`/engagement/targets/${targetType}/${targetId}/likes`, { method: 'POST' }),

  unlike: (targetType, targetId) =>
    apiRequest(`/engagement/targets/${targetType}/${targetId}/likes`, { method: 'DELETE' }),

  likeCount: (targetType, targetId) =>
    apiRequest(`/engagement/targets/${targetType}/${targetId}/likes/count`, { method: 'GET' }),

  sharePost: (postId) =>
    apiRequest(`/engagement/posts/${postId}/shares`, { method: 'POST' }),

  unsharePost: (postId) =>
    apiRequest(`/engagement/posts/${postId}/shares`, { method: 'DELETE' }),

  shareCount: (postId) =>
    apiRequest(`/engagement/posts/${postId}/shares/count`, { method: 'GET' }),

  updatePost: (postId, data) =>
    apiRequest(`/engagement/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePost: (postId) =>
    apiRequest(`/engagement/posts/${postId}`, { method: 'DELETE' }),
};

export const adminApi = {
  getStats: () =>
    apiRequest('/admin/stats', { method: 'GET' }),

  getUsers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.query) q.set('query', params.query);
    if (params.role) q.set('role', params.role);
    if (params.accountStatus) q.set('accountStatus', params.accountStatus);
    if (params.creatorStatus) q.set('creatorStatus', params.creatorStatus);
    q.set('page', String(params.page || 0));
    q.set('size', String(params.size || 20));
    return apiRequest(`/admin/users?${q.toString()}`, { method: 'GET' });
  },

  getUser: (userId) =>
    apiRequest(`/admin/users/${userId}`, { method: 'GET' }),

  updateRoles: (userId, roles) =>
    apiRequest(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    }),

  updateStatus: (userId, statusData) =>
    apiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
};

export const moderationApi = {
  getStats: () =>
    apiRequest('/moderation/stats', { method: 'GET' }),

  getReports: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.targetType) q.set('targetType', params.targetType);
    q.set('page', String(params.page || 0));
    q.set('size', String(params.size || 20));
    return apiRequest(`/moderation/reports?${q.toString()}`, { method: 'GET' });
  },

  getReport: (reportId) =>
    apiRequest(`/moderation/reports/${reportId}`, { method: 'GET' }),

  createReport: (reportData) =>
    apiRequest('/moderation/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  resolveReport: (reportId, resolutionData) =>
    apiRequest(`/moderation/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolutionData),
    }),
};

export default authApi;
