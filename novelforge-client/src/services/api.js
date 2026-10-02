// API Configuration and Client
// Production-grade client connectivity for NovelForge

export const SERVICES_CONFIG = {
  GATEWAY_URL: 'https://api-gateway-g43i.onrender.com',
  IDENTITY_SERVICE_URL: 'https://identity-service-0jgj.onrender.com',
  NOTIFICATION_SERVICE_URL: 'https://notification-service-ng1j.onrender.com',
  NOVEL_SERVICE_URL: 'https://novel-service.onrender.com',
  EUREKA_SERVER_URL: 'https://eureka-service-hdxn.onrender.com',
  FRONTEND_URL: 'https://novelforge-7aa8.onrender.com',
};

/**
 * Normalizes any provided URL string ensuring correct protocol and no trailing slash.
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    const isLocal = trimmed.includes('localhost') || trimmed.includes('127.0.0.1');
    trimmed = `${isLocal ? 'http://' : 'https://'}${trimmed}`;
  }
  return trimmed;
};

/**
 * Resolves the primary API Gateway base URL.
 * Checks in order:
 * 1. User manual override (localStorage 'novelforge_api_base')
 * 2. Environment variable (import.meta.env.VITE_API_URL)
 * 3. Default live production API Gateway URL
 */
export const getBaseUrl = () => {
  const custom = localStorage.getItem('novelforge_api_base');
  if (custom && custom.trim().length > 0) {
    return normalizeUrl(custom).replace(/\/api\/v1\/(identity|novels|notifications)$/, '');
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return normalizeUrl(envUrl).replace(/\/api\/v1\/(identity|novels|notifications)$/, '');
  }

  return SERVICES_CONFIG.GATEWAY_URL;
};

export const setBaseUrl = (url) => {
  if (!url) {
    resetBaseUrl();
  } else {
    localStorage.setItem('novelforge_api_base', normalizeUrl(url));
  }
};

export const resetBaseUrl = () => {
  localStorage.removeItem('novelforge_api_base');
};

/**
 * Normalizes endpoint paths to route through the API Gateway microservice prefixes.
 */
export const resolveEndpoint = (endpoint) => {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }

  // Already prefixed
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint;
  }

  // Map auth and registration paths to identity service gateway route
  if (endpoint.startsWith('/auth/') || endpoint.startsWith('/register')) {
    return `/api/v1/identity${endpoint}`;
  }

  // Map novel paths to novel service gateway route
  if (endpoint.startsWith('/novels')) {
    return `/api/v1${endpoint}`;
  }

  // Map notification paths
  if (endpoint.startsWith('/notifications')) {
    return `/api/v1${endpoint}`;
  }

  return endpoint;
};

/**
 * Universal fetch wrapper with retry, auto-refresh token, timeout, and credentials.
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const resolvedEndpoint = resolveEndpoint(endpoint);
  const url = `${baseUrl}${resolvedEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach token if provided or stored
  const token = options.token || localStorage.getItem('novelforge_access_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Abort controller with configurable timeout (default 45s for free tier wakeups)
  const timeoutMs = options.timeoutMs || 45000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    headers,
    signal: options.signal || controller.signal,
    credentials: 'include', // Needed for HttpOnly refresh-token cookies
  };

  try {
    let response;
    try {
      response = await fetch(url, config);
    } finally {
      clearTimeout(timeoutId);
    }

    // Auto-refresh token on 401 Unauthorized
    if (
      response.status === 401 &&
      !resolvedEndpoint.includes('/auth/refresh') &&
      !resolvedEndpoint.includes('/auth/login') &&
      !resolvedEndpoint.includes('/register') &&
      !options._isRetry
    ) {
      try {
        const refreshResponse = await authApi.refreshToken();
        if (refreshResponse && refreshResponse.accessToken) {
          localStorage.setItem('novelforge_access_token', refreshResponse.accessToken);
          headers['Authorization'] = `Bearer ${refreshResponse.accessToken}`;
          return await apiRequest(endpoint, {
            ...options,
            headers,
            _isRetry: true,
          });
        }
      } catch (refreshErr) {
        localStorage.removeItem('novelforge_access_token');
      }
    }

    // Handle empty 204 No Content
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
      let errorMessage = 'An error occurred';
      if (typeof data === 'string' && data.trim().length > 0) {
        errorMessage = data;
      } else if (data && typeof data === 'object') {
        errorMessage = data.message || data.error || JSON.stringify(data);
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `Request to ${baseUrl} timed out after ${timeoutMs / 1000}s. On Render free tier, services sleep after inactivity and can take 40-50 seconds to wake up. Please retry in a moment.`
      );
    }
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(
        `Unable to reach backend gateway at ${baseUrl}. Ensure services are awake and network is reachable.`
      );
    }
    throw err;
  }
}

// Authentication & Identity Services
export const authApi = {
  // Registration Flow
  sendRegisterOtp: async (email) => {
    return apiRequest('/register/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyRegisterOtp: async (email, otp) => {
    return apiRequest('/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  register: async (userData) => {
    return apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login Flow
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Refresh Token Flow (Sends HttpOnly cookie automatically)
  refreshToken: async () => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
    });
  },

  // Current User (/me)
  getMe: async (token) => {
    return apiRequest('/auth/me', {
      method: 'GET',
      token,
    });
  },

  // Logout Flow
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Forgot Password Flow
  forgotPasswordSendOtp: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotPasswordVerifyOtp: async (email, otp) => {
    return apiRequest('/auth/forgot-password/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  forgotPasswordReset: async (email, newPassword) => {
    return apiRequest('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },
};

// Novel Service Operations
export const novelApi = {
  // Get all novels (paginated)
  getAllNovels: async (page = 0) => {
    return apiRequest(`/novels?page=${page}`, {
      method: 'GET',
    });
  },

  // Search novels by query
  searchNovels: async (query, page = 0) => {
    return apiRequest(`/novels/search?query=${encodeURIComponent(query)}&page=${page}`, {
      method: 'GET',
    });
  },

  // Get single novel by ID
  getNovelById: async (id) => {
    return apiRequest(`/novels/${id}`, {
      method: 'GET',
    });
  },

  // Create novel (requires authenticated user)
  createNovel: async (novelData) => {
    return apiRequest('/novels', {
      method: 'POST',
      body: JSON.stringify(novelData),
    });
  },

  // Update novel
  updateNovel: async (id, novelData) => {
    return apiRequest(`/novels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(novelData),
    });
  },

  // Delete novel
  deleteNovel: async (id) => {
    return apiRequest(`/novels/${id}`, {
      method: 'DELETE',
    });
  },
};

// System & Microservice Health Checks
export const healthApi = {
  checkGateway: async () => {
    return apiRequest('/actuator/health', { method: 'GET', timeoutMs: 15000 });
  },

  checkIdentityService: async () => {
    const directUrl = `${SERVICES_CONFIG.IDENTITY_SERVICE_URL}/actuator/health`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(15000) });
    return res.ok;
  },

  checkNovelService: async () => {
    const directUrl = `${SERVICES_CONFIG.NOVEL_SERVICE_URL}/actuator/health`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(15000) });
    return res.ok;
  },

  checkNotificationService: async () => {
    const directUrl = `${SERVICES_CONFIG.NOTIFICATION_SERVICE_URL}/actuator/health`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(15000) });
    return res.ok;
  },

  checkEurekaServer: async () => {
    const directUrl = `${SERVICES_CONFIG.EUREKA_SERVER_URL}/`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(15000) });
    return res.ok;
  },
};

export default authApi;
