import { APIConsumerConfig, ServerInfo, Tool } from './types';

/**
 * Default configuration for API Consumer server
 */
const DEFAULT_CONFIG: Required<APIConsumerConfig> = {
  timeout: 30000,
  maxConcurrentRequests: 10,
  enableMockServer: true,
  testFrameworks: ['jest', 'vitest', 'mocha'],
};

/**
 * APIConsumerServer - Main MCP server implementation
 */
export class APIConsumerServer {
  public readonly name = 'api-consumer';
  public readonly version = '0.1.0';
  private readonly protocolVersion = '2024-11-05';
  public readonly config: Required<APIConsumerConfig>;

  constructor(config: APIConsumerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get server information
   */
  getServerInfo(): ServerInfo {
    return {
      name: this.name,
      version: this.version,
      protocolVersion: this.protocolVersion,
    };
  }

  /**
   * List available tools
   */
  listTools(): Tool[] {
    const tools: Tool[] = [
      {
        name: 'create_request',
        description: 'Create an HTTP request configuration',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
              description: 'HTTP method',
            },
            url: { type: 'string', description: 'Request URL' },
            headers: {
              type: 'object',
              description: 'Request headers',
              additionalProperties: { type: 'string' },
            },
            params: {
              type: 'object',
              description: 'Query parameters',
            },
            data: {
              description: 'Request body data',
            },
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds',
              default: 30000,
            },
          },
          required: ['method', 'url'],
        },
      },
      {
        name: 'execute_request',
        description: 'Execute an HTTP request and return the response',
        inputSchema: {
          type: 'object',
          properties: {
            request: {
              type: 'object',
              description: 'Request configuration (from create_request)',
            },
          },
          required: ['request'],
        },
      },
      {
        name: 'import_openapi',
        description: 'Import and parse OpenAPI/Swagger specification',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'File path or URL to OpenAPI specification',
            },
            sourceType: {
              type: 'string',
              enum: ['file', 'url'],
              description: 'Type of source',
              default: 'file',
            },
          },
          required: ['source'],
        },
      },
      {
        name: 'generate_test_suite',
        description: 'Generate test cases from OpenAPI specification',
        inputSchema: {
          type: 'object',
          properties: {
            specification: {
              type: 'object',
              description: 'Parsed OpenAPI specification',
            },
            framework: {
              type: 'string',
              enum: ['jest', 'vitest', 'mocha'],
              description: 'Test framework',
              default: 'jest',
            },
            coverage: {
              type: 'string',
              enum: ['basic', 'comprehensive', 'exhaustive'],
              description: 'Test coverage level',
              default: 'comprehensive',
            },
          },
          required: ['specification'],
        },
      },
      {
        name: 'execute_test_workflow',
        description: 'Execute a test workflow with orchestration',
        inputSchema: {
          type: 'object',
          properties: {
            workflow: {
              type: 'string',
              description: 'Workflow ID or name',
            },
            endpoints: {
              type: 'array',
              description: 'Endpoints to test',
              items: { type: 'object' },
            },
            environment: {
              type: 'object',
              description: 'Test environment configuration',
            },
            parallel: {
              type: 'boolean',
              description: 'Run tests in parallel',
              default: false,
            },
          },
          required: ['workflow', 'endpoints'],
        },
      },
      {
        name: 'validate_response',
        description: 'Validate API response against expected schema',
        inputSchema: {
          type: 'object',
          properties: {
            response: {
              type: 'object',
              description: 'Actual API response',
            },
            expectedSchema: {
              type: 'object',
              description: 'Expected response schema',
            },
            assertions: {
              type: 'array',
              description: 'Additional assertions to perform',
              items: { type: 'object' },
            },
          },
          required: ['response', 'expectedSchema'],
        },
      },
      {
        name: 'create_mock_server',
        description: 'Create a mock API server from specification',
        inputSchema: {
          type: 'object',
          properties: {
            specification: {
              type: 'object',
              description: 'OpenAPI specification',
            },
            port: {
              type: 'number',
              description: 'Port for mock server',
              default: 3000,
            },
            responseDelay: {
              type: 'number',
              description: 'Simulated response delay in ms',
              default: 0,
            },
          },
          required: ['specification'],
        },
      },
      {
        name: 'analyze_performance',
        description: 'Analyze API performance and response times',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: {
              type: 'object',
              description: 'Endpoint to analyze',
            },
            iterations: {
              type: 'number',
              description: 'Number of test iterations',
              default: 100,
            },
            concurrency: {
              type: 'number',
              description: 'Concurrent requests',
              default: 10,
            },
          },
          required: ['endpoint'],
        },
      },
    ];

    return tools;
  }
}
