/**
 * NovelForge Centralized HTTP API Client
 * Production-grade HTTP client communicating exclusively through the API Gateway.
 */

import { normalizeError } from './errors';
import { resolveEndpoint } from './endpoints';

export const STORAGE_TOKEN_KEY = 'novelforge_access_token';

/**
 * Validates environment configuration during startup.
 * Throws a clear, actionable error if prohibited microservice variables are detected.
 */
export function validateApiConfiguration() {
  const env = import.meta.env;
  const prohibitedVars = [
    'VITE_IDENTITY_SERVICE_URL',
    'VITE_NOVEL_SERVICE_URL',
    'VITE_NOTIFICATION_SERVICE_URL',
    'VITE_ENGAGEMENT_SERVICE_URL',
    'VITE_ANALYTICS_SERVICE_URL',
    'VITE_AI_SERVICE_URL',
  ];

  const detected = prohibitedVars.filter((key) => Boolean(env[key]));
  if (detected.length > 0) {
    const errorMsg = `[NovelForge Architecture Violation] Prohibited microservice URLs detected in environment: ${detected.join(
      ', '
    )}. The frontend must exclusively route through the central API Gateway via VITE_API_BASE_URL.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Normalizes base URL, stripping trailing slashes or duplicate /api/v1 prefixes.
 */
export function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
}

/**
 * Resolves the API Gateway Base URL.
 * In development, defaults to VITE_API_BASE_URL (or http://localhost:8080).
 * In production, empty string is permitted ONLY if relative reverse-proxy routing is used.
 */
export function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl) {
    return normalizeBaseUrl(baseUrl);
  }

  // Running in browser with relative proxy (Docker / Nginx reverse proxy)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return '';
  }

  return 'http://localhost:8080';
}

// Token refresh mutex & subscriber queue to handle concurrent 401 failures safely
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onTokenRefreshFailed(err) {
  refreshSubscribers.forEach((cb) => cb(null, err));
  refreshSubscribers = [];
}

/**
 * Core HTTP client. All requests flow through this function.
 */
export async function apiClient(endpoint, options = {}) {
  validateApiConfiguration();

  const baseUrl = getApiBaseUrl();
  const resolvedPath = resolveEndpoint(endpoint);
  const fullUrl = `${baseUrl}${resolvedPath}`;

  const headers = { ...options.headers };

  // Set Content-Type to JSON unless the body is FormData (multipart)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Correlation & Request Tracing ID
  if (!headers['X-Request-Id']) {
    headers['X-Request-Id'] = `nf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // Attach Bearer Access Token if available
  const token =
    options.token ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Request timeout support (default 30 seconds)
  const timeoutMs = options.timeoutMs || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link caller's AbortSignal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const fetchConfig = {
    ...options,
    headers,
    signal: controller.signal,
    credentials: 'include', // Guarantees HttpOnly refresh-token cookies are transmitted
  };

  try {
    let response;
    try {
      response = await fetch(fullUrl, fetchConfig);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle 401 Unauthorized for access token expiration (excluding auth endpoints themselves)
    const isAuthEndpoint =
      resolvedPath.includes('/auth/login') ||
      resolvedPath.includes('/auth/refresh') ||
      resolvedPath.includes('/register');

    if (response.status === 401 && !isAuthEndpoint && !options._isRetry) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Perform silent token refresh via HttpOnly cookie
          const refreshUrl = `${baseUrl}/api/v1/identity/auth/refresh`;
          const refreshRes = await fetch(refreshUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh token expired or invalid');
          }

          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData?.accessToken;

          if (newAccessToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_TOKEN_KEY, newAccessToken);
            }
            isRefreshing = false;
            onTokenRefreshed(newAccessToken);

            // Retry original request with fresh token
            return apiClient(endpoint, {
              ...options,
              token: newAccessToken,
              _isRetry: true,
            });
          }
          throw new Error('No access token in refresh response');
        } catch (refreshErr) {
          isRefreshing = false;
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
          }
          onTokenRefreshFailed(refreshErr);
          throw normalizeError(refreshErr, null, 401);
        }
      } else {
        // Wait for active token refresh to resolve
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken, refreshErr) => {
            if (newToken) {
              resolve(
                apiClient(endpoint, {
                  ...options,
                  token: newToken,
                  _isRetry: true,
                })
              );
            } else {
              reject(normalizeError(refreshErr || new Error('Session expired'), null, 401));
            }
          });
        });
      }
    }

    // 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData = null;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textData = await response.text();
      try {
        responseData = JSON.parse(textData);
      } catch {
        responseData = textData;
      }
    }

    if (!response.ok) {
      throw normalizeError(null, responseData, response.status);
    }

    return responseData;
  } catch (err) {
    throw normalizeError(err, null, err.status || 0);
  }
}

export default apiClient;
