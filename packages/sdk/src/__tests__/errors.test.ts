import {
  NotificationSDKError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from '../errors';

describe('Error classes', () => {
  describe('NotificationSDKError', () => {
    it('should create error with message', () => {
      const error = new NotificationSDKError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('NotificationSDKError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotificationSDKError);
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed. Please check your API key.');
      expect(error.name).toBe('AuthenticationError');
      expect(error).toBeInstanceOf(NotificationSDKError);
    });

    it('should create error with custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with resource and identifier', () => {
      const error = new NotFoundError('User', 'user-123');
      expect(error.message).toBe("User with identifier 'user-123' not found.");
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(NotificationSDKError);
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and errors object', () => {
      const errors = {
        email: ['Invalid email format'],
        name: ['Name is required'],
      };
      const error = new ValidationError('Validation failed', errors);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(NotificationSDKError);
    });

    it('should create error with empty errors object', () => {
      const error = new ValidationError('Validation failed');
      expect(error.errors).toEqual({});
    });
  });

  describe('RateLimitError', () => {
    it('should create error with default message', () => {
      const error = new RateLimitError();
      expect(error.message).toBe('Rate limit exceeded.');
      expect(error.name).toBe('RateLimitError');
      expect(error.retryAfter).toBeUndefined();
      expect(error).toBeInstanceOf(NotificationSDKError);
    });

    it('should create error with retry-after value', () => {
      const error = new RateLimitError('Too many requests', 60);
      expect(error.message).toBe('Too many requests');
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('NetworkError', () => {
    it('should create error with default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network request failed.');
      expect(error.name).toBe('NetworkError');
      expect(error).toBeInstanceOf(NotificationSDKError);
    });

    it('should create error with custom message', () => {
      const error = new NetworkError('Connection timeout');
      expect(error.message).toBe('Connection timeout');
    });
  });
});
