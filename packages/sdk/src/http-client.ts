import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  NotificationSDKError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from './errors';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * HTTP client wrapper for making API requests
 */
export class HttpClient {
  private client: AxiosInstance;

  constructor(config: HttpClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    // Network errors (no response)
    if (!error.response) {
      return new NetworkError(error.message || 'Network request failed.');
    }

    const { status, data } = error.response;
    const errorData = data as Record<string, unknown>;
    const message = (errorData?.error as string) || (errorData?.message as string) || 'An error occurred';

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 404:
        return new NotFoundError('Resource', message);
      case 422:
      case 400: {
        const errors = (errorData?.errors as Record<string, string[]>) || {};
        return new ValidationError(message, errors);
      }
      case 429: {
        const retryAfter = error.response.headers['retry-after']
          ? parseInt(error.response.headers['retry-after'])
          : undefined;
        return new RateLimitError(message, retryAfter);
      }
      default:
        return new NotificationSDKError(message);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
