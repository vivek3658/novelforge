import authApi, { getBaseUrl, setBaseUrl, resetBaseUrl, apiRequest } from './services/api';

export const buildApiUrl = (path) => `${getBaseUrl()}${path}`;
export const API_BASE_URL = getBaseUrl();

export { authApi, getBaseUrl, setBaseUrl, resetBaseUrl, apiRequest };
export default authApi;
