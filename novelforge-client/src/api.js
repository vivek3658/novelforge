const API_BASE_URL = 'http://localhost:8081/api/v1';

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export default API_BASE_URL;
