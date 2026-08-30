// API Configuration and Client
const DEFAULT_GATEWAY_URL = 'http://localhost:8080/api/v1/identity';
const DIRECT_IDENTITY_URL = 'http://localhost:8081/api/v1/identity';

export const getBaseUrl = () => {
  return (
    localStorage.getItem('novelforge_api_base') ||
    import.meta.env.VITE_API_URL ||
    DEFAULT_GATEWAY_URL
  );
};

export const setBaseUrl = (url) => {
  localStorage.setItem('novelforge_api_base', url);
};

export const resetBaseUrl = () => {
  localStorage.removeItem('novelforge_api_base');
};

/**
 * Universal fetch wrapper that includes credentials (for refreshToken cookies)
 * and attaches Authorization header if token is available.
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach token if provided or stored
  const token = options.token || localStorage.getItem('novelforge_access_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly refreshToken cookie transmission
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized and not already on refresh/login endpoints, attempt auto refresh
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/register') &&
      !options._isRetry
    ) {
      try {
        const refreshResponse = await authApi.refreshToken();
        if (refreshResponse && refreshResponse.accessToken) {
          localStorage.setItem('novelforge_access_token', refreshResponse.accessToken);
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${refreshResponse.accessToken}`;
          response = await fetch(url, { ...config, headers, _isRetry: true });
        }
      } catch (refreshErr) {
        // Refresh failed, propagate 401
        localStorage.removeItem('novelforge_access_token');
      }
    }

    // Handle empty 204 response
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
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to server at ${baseUrl}. Please ensure API Gateway (:8080) or Identity Service (:8081) is running.`
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

export default authApi;
