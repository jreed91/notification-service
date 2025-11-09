import { Response, NextFunction } from 'express';
import { authenticateTenant, AuthRequest } from '../middleware/auth';
import { db } from '../database/client';

// Mock the database
jest.mock('../database/client', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no API key is provided', async () => {
    await authenticateTenant(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'API key required' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is invalid', async () => {
    mockRequest.headers = { 'x-api-key': 'invalid-key' };
    (db.query as jest.Mock).mockResolvedValue({ rows: [] });

    await authenticateTenant(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should attach tenant to request if API key is valid', async () => {
    const mockTenant = {
      id: 'tenant-123',
      name: 'Test Tenant',
      api_key: 'valid-key',
      active: true,
    };

    mockRequest.headers = { 'x-api-key': 'valid-key' };
    (db.query as jest.Mock).mockResolvedValue({ rows: [mockTenant] });

    await authenticateTenant(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.tenant).toEqual(mockTenant);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 500 if database query fails', async () => {
    mockRequest.headers = { 'x-api-key': 'valid-key' };
    (db.query as jest.Mock).mockRejectedValue(new Error('Database error'));

    await authenticateTenant(
      mockRequest as AuthRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
