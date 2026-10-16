/**
 * NovelForge API Error Normalization & Error Classes
 * Provides typed, predictable error handling without exposing credentials or internal traces.
 */

export class ApiError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Unable to connect to NovelForge API Gateway. Please check your network.') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Request timed out. Please try again.') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Your session has expired. Please log in again.') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'A conflict occurred. The resource or identifier already exists.') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed. Please verify your input.', fieldErrors = {}) {
    super(message, 400, 'VALIDATION_ERROR', fieldErrors);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Normalizes any error, fetch response, or caught exception into a uniform ApiError instance.
 */
export function normalizeError(err, responseData = null, status = 0) {
  if (err instanceof ApiError) {
    return err;
  }

  if (err?.name === 'AbortError') {
    return new TimeoutError();
  }

  if (err?.name === 'TypeError' && err?.message?.toLowerCase().includes('fetch')) {
    return new NetworkError();
  }

  let resolvedMessage = 'An unexpected error occurred. Please try again.';
  let code = 'UNKNOWN_ERROR';
  let fieldErrors = null;

  if (typeof responseData === 'string' && responseData.trim().length > 0) {
    resolvedMessage = responseData;
  } else if (responseData && typeof responseData === 'object') {
    if (responseData.message) resolvedMessage = responseData.message;
    else if (responseData.error) resolvedMessage = responseData.error;
    else if (responseData.details) resolvedMessage = responseData.details;

    if (responseData.code) code = responseData.code;
    if (responseData.fieldErrors || responseData.errors) {
      fieldErrors = responseData.fieldErrors || responseData.errors;
    }
  } else if (err?.message) {
    resolvedMessage = err.message;
  }

  switch (status) {
    case 400:
      return new ValidationError(resolvedMessage, fieldErrors);
    case 401:
      return new AuthError(resolvedMessage);
    case 403:
      return new ForbiddenError(resolvedMessage);
    case 404:
      return new NotFoundError(resolvedMessage);
    case 409:
      return new ConflictError(resolvedMessage);
    case 408:
      return new TimeoutError(resolvedMessage);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ApiError(
        'The NovelForge service is temporarily unavailable. Please retry in a few moments.',
        status,
        'SERVER_ERROR',
        responseData
      );
    default:
      return new ApiError(resolvedMessage, status, code, responseData);
  }
}

/**
 * Safely sanitizes request or response bodies to prevent sensitive data logging.
 */
export function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'newPassword', 'oldPassword', 'token', 'accessToken', 'refreshToken', 'otp', 'secret'];
  
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const copy = { ...data };
  for (const key of Object.keys(copy)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      copy[key] = '***MASKED***';
    } else if (typeof copy[key] === 'object') {
      copy[key] = maskSensitiveData(copy[key]);
    }
  }
  return copy;
}
