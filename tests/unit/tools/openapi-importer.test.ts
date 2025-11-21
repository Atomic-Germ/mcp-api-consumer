import {
  OpenAPIImporter,
  OpenAPIImportError,
  ValidationError,
} from '../../../src/tools/openapi-importer';
import * as fs from 'fs/promises';
import axios from 'axios';

jest.mock('fs/promises');
jest.mock('axios');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenAPI Importer', () => {
  let importer: OpenAPIImporter;

  beforeEach(() => {
    jest.clearAllMocks();
    importer = new OpenAPIImporter();
  });

  describe('importFromFile', () => {
    it('should import a minimal valid OpenAPI 3.0 JSON spec', async () => {
      // Arrange
      const minimalSpec = JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'List users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(minimalSpec);

      // Act
      const spec = await importer.importFromFile('/path/to/spec.json');

      // Assert
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.endpoints).toHaveLength(1);
      expect(spec.endpoints[0].path).toBe('/users');
      expect(spec.endpoints[0].method).toBe('GET');
      expect(mockedFs.readFile).toHaveBeenCalledWith('/path/to/spec.json', 'utf-8');
    });

    it('should import OpenAPI spec from YAML file', async () => {
      // Arrange
      const yamlSpec = `
openapi: 3.0.0
info:
  title: YAML API
  version: 2.0.0
paths:
  /posts:
    post:
      summary: Create post
      responses:
        '201':
          description: Created
`;
      mockedFs.readFile.mockResolvedValue(yamlSpec);

      // Act
      const spec = await importer.importFromFile('/path/to/spec.yaml');

      // Assert
      expect(spec.info.title).toBe('YAML API');
      expect(spec.endpoints[0].method).toBe('POST');
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Arrange
      const invalidSpec = JSON.stringify({
        openapi: '3.0.0',
        // Missing 'info' field
        paths: {},
      });
      mockedFs.readFile.mockResolvedValue(invalidSpec);

      // Act & Assert
      await expect(importer.importFromFile('/path/to/invalid.json')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw OpenAPIImportError for file not found', async () => {
      // Arrange
      mockedFs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      // Act & Assert
      await expect(importer.importFromFile('/nonexistent.json')).rejects.toThrow(
        OpenAPIImportError
      );
    });
  });

  describe('importFromUrl', () => {
    it('should import OpenAPI spec from URL', async () => {
      // Arrange
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Remote API', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValue({ data: spec });

      // Act
      const result = await importer.importFromUrl('https://api.example.com/openapi.json');

      // Assert
      expect(result.info.title).toBe('Remote API');
      expect(result.endpoints[0].path).toBe('/items');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/openapi.json');
    });

    it('should throw OpenAPIImportError for network errors', async () => {
      // Arrange
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(importer.importFromUrl('https://invalid.url')).rejects.toThrow(
        OpenAPIImportError
      );
    });
  });

  describe('endpoint extraction', () => {
    it('should extract multiple endpoints with different methods', async () => {
      // Arrange
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users': {
            get: { responses: { '200': { description: 'OK' } } },
            post: { responses: { '201': { description: 'Created' } } },
          },
          '/users/{id}': {
            get: { responses: { '200': { description: 'OK' } } },
            delete: { responses: { '204': { description: 'Deleted' } } },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(spec);

      // Act
      const result = await importer.importFromFile('/spec.json');

      // Assert
      expect(result.endpoints).toHaveLength(4);
      expect(result.endpoints.map((e) => `${e.method} ${e.path}`)).toEqual([
        'GET /users',
        'POST /users',
        'GET /users/{id}',
        'DELETE /users/{id}',
      ]);
    });

    it('should extract path parameters', async () => {
      // Arrange
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users/{userId}': {
            get: {
              parameters: [
                {
                  name: 'userId',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(spec);

      // Act
      const result = await importer.importFromFile('/spec.json');

      // Assert
      const endpoint = result.endpoints[0];
      expect(endpoint.parameters).toHaveLength(1);
      expect(endpoint.parameters[0].name).toBe('userId');
      expect(endpoint.parameters[0].in).toBe('path');
      expect(endpoint.parameters[0].required).toBe(true);
      expect(endpoint.parameters[0].schema.type).toBe('string');
    });

    it('should extract query parameters', async () => {
      // Arrange
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              parameters: [
                { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(spec);

      // Act
      const result = await importer.importFromFile('/spec.json');

      // Assert
      expect(result.endpoints[0].parameters).toHaveLength(2);
      expect(result.endpoints[0].parameters[0].name).toBe('page');
      expect(result.endpoints[0].parameters[0].in).toBe('query');
    });

    it('should extract request body information', async () => {
      // Arrange
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
              responses: { '201': { description: 'Created' } },
            },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(spec);

      // Act
      const result = await importer.importFromFile('/spec.json');

      // Assert
      const endpoint = result.endpoints[0];
      expect(endpoint.requestBody).toBeDefined();
      expect(endpoint.requestBody!.required).toBe(true);
      expect(endpoint.requestBody!.content).toHaveLength(1);
      expect(endpoint.requestBody!.content[0].mimeType).toBe('application/json');
    });

    it('should extract response schemas', async () => {
      // Arrange
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                    },
                  },
                },
                '404': {
                  description: 'Not found',
                },
              },
            },
          },
        },
      });
      mockedFs.readFile.mockResolvedValue(spec);

      // Act
      const result = await importer.importFromFile('/spec.json');

      // Assert
      const endpoint = result.endpoints[0];
      expect(endpoint.responses).toHaveLength(2);
      expect(endpoint.responses[0].statusCode).toBe('200');
      expect(endpoint.responses[0].description).toBe('Success');
      expect(endpoint.responses[1].statusCode).toBe('404');
    });
  });
});
