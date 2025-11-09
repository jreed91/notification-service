/**
 * Base error class for all SDK errors
 */
export class NotificationSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationSDKError';
    Object.setPrototypeOf(this, NotificationSDKError.prototype);
  }
}

/**
 * Error thrown when authentication fails (invalid API key)
 */
export class AuthenticationError extends NotificationSDKError {
  constructor(message = 'Authentication failed. Please check your API key.') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends NotificationSDKError {
  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found.`);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends NotificationSDKError {
  public errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when rate limiting is applied
 */
export class RateLimitError extends NotificationSDKError {
  public retryAfter?: number;

  constructor(message = 'Rate limit exceeded.', retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends NotificationSDKError {
  constructor(message = 'Network request failed.') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
