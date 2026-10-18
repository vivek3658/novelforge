/**
 * NovelForge API Gateway Services Facade
 * Unified facade routing through the centralized architecture:
 * Browser → API Gateway (VITE_API_BASE_URL) → Backend Microservices
 */

import {
  apiClient,
  getApiBaseUrl,
  normalizeBaseUrl,
  validateApiConfiguration,
  STORAGE_TOKEN_KEY,
} from '../lib/api/client';
import { resolveEndpoint, ENDPOINTS } from '../lib/api/endpoints';
import { normalizeError, ApiError, NetworkError, TimeoutError, AuthError } from '../lib/api/errors';

import { authApi } from '../features/auth/api/auth.api';
import { profileApi } from '../features/profile/api/profile.api';
import { accountApi } from '../features/account/api/account.api';
import { studioApi } from '../features/studios/api/studios.api';
import { novelApi } from '../features/novels/api/novels.api';
import { chaptersApi } from '../features/chapters/api/chapters.api';
import { engagementApi } from '../features/engagement/api/engagement.api';

// Validate configuration on initial evaluation
try {
  validateApiConfiguration();
} catch (e) {
  console.warn(e.message);
}

// Backward compatibility alias for legacy apiRequest callers
export const apiRequest = apiClient;
export const getBaseUrl = getApiBaseUrl;
export const normalizeUrl = normalizeBaseUrl;

// Optional client ImageKit public asset delivery configuration
export const imageKitConfig = {
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  isDirectUploadSupported: false,
};

export {
  apiClient,
  getApiBaseUrl,
  normalizeBaseUrl,
  resolveEndpoint,
  validateApiConfiguration,
  normalizeError,
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  authApi,
  profileApi,
  accountApi,
  studioApi,
  novelApi,
  chaptersApi,
  engagementApi,
  ENDPOINTS,
  STORAGE_TOKEN_KEY,
};

export default authApi;
