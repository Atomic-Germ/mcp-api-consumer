import { createRequest, executeRequest } from '../../../src/tools/http-request';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HTTP Request Builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create and execute a simple GET request', async () => {
      // Arrange
      const mockResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      };
      mockedAxios.request.mockResolvedValue(mockResponse);

      const requestConfig = {
        method: 'GET' as const,
        url: 'https://api.example.com/users',
        headers: {
          Authorization: 'Bearer token123',
        },
      };

      // Act
      const request = createRequest(requestConfig);
      const response = await executeRequest(request);

      // Assert
      expect(request).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.example.com/users');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'success' });
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.example.com/users',
        })
      );
    });

    it('should create a POST request with JSON body', async () => {
      // Arrange
      const mockResponse = {
        data: { id: 123, created: true },
        status: 201,
        statusText: 'Created',
        headers: {},
      };
      mockedAxios.request.mockResolvedValue(mockResponse);

      const requestConfig = {
        method: 'POST' as const,
        url: 'https://api.example.com/users',
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'John Doe', email: 'john@example.com' },
      };

      // Act
      const request = createRequest(requestConfig);
      const response = await executeRequest(request);

      // Assert
      expect(request.method).toBe('POST');
      expect(request.data).toEqual({ name: 'John Doe', email: 'john@example.com' });
      expect(response.status).toBe(201);
      expect(response.data.created).toBe(true);
    });

    it('should handle query parameters', async () => {
      // Arrange
      const mockResponse = {
        data: [{ id: 1 }, { id: 2 }],
        status: 200,
        statusText: 'OK',
        headers: {},
      };
      mockedAxios.request.mockResolvedValue(mockResponse);

      const requestConfig = {
        method: 'GET' as const,
        url: 'https://api.example.com/users',
        params: { page: 1, limit: 10, sort: 'name' },
      };

      // Act
      const request = createRequest(requestConfig);
      await executeRequest(request);

      // Assert
      expect(request.params).toEqual({ page: 1, limit: 10, sort: 'name' });
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ params: { page: 1, limit: 10, sort: 'name' } })
      );
    });

    it('should set default timeout of 30 seconds', () => {
      // Arrange & Act
      const request = createRequest({
        method: 'GET',
        url: 'https://api.example.com/test',
      });

      // Assert
      expect(request.timeout).toBe(30000);
    });

    it('should allow custom timeout', () => {
      // Arrange & Act
      const request = createRequest({
        method: 'GET',
        url: 'https://api.example.com/test',
        timeout: 5000,
      });

      // Assert
      expect(request.timeout).toBe(5000);
    });
  });
});
