import * as fs from 'fs/promises';
import axios from 'axios';
import * as yaml from 'yaml';

/**
 * Custom error types
 */
export class OpenAPIImportError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'OpenAPIImportError';
  }
}

export class ValidationError extends OpenAPIImportError {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type definitions
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface APIInfo {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}

export interface Schema {
  readonly type: string;
  readonly properties?: Record<string, Schema>;
  readonly items?: Schema;
  readonly required?: string[];
  readonly enum?: any[];
  readonly format?: string;
  [key: string]: any;
}

export interface Parameter {
  readonly name: string;
  readonly in: 'path' | 'query' | 'header' | 'cookie';
  readonly required: boolean;
  readonly schema: Schema;
  readonly description?: string;
}

export interface MediaType {
  readonly mimeType: string;
  readonly schema?: Schema;
}

export interface RequestBody {
  readonly required: boolean;
  readonly content: MediaType[];
}

export interface ResponseSchema {
  readonly statusCode: string;
  readonly description: string;
  readonly content?: MediaType[];
}

export interface Endpoint {
  readonly path: string;
  readonly method: HTTPMethod;
  readonly operationId?: string;
  readonly summary?: string;
  readonly parameters: Parameter[];
  readonly requestBody?: RequestBody;
  readonly responses: ResponseSchema[];
}

export interface Components {
  readonly schemas?: Record<string, Schema>;
  readonly parameters?: Record<string, Parameter>;
  readonly responses?: Record<string, ResponseSchema>;
}

export interface OpenAPISpecification {
  readonly info: APIInfo;
  readonly endpoints: Endpoint[];
  readonly components?: Components;
  readonly raw: any;
}

/**
 * OpenAPI Importer Implementation
 */
export class OpenAPIImporter {
  /**
   * Import OpenAPI specification from a file
   */
  async importFromFile(filePath: string): Promise<OpenAPISpecification> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const format = this.detectFormat(filePath);
      const document = this.parseDocument(content, format);
      this.validateSpec(document);
      return this.extractSpecification(document);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OpenAPIImportError) {
        throw error;
      }
      throw new OpenAPIImportError(
        `Failed to import OpenAPI spec from file: ${filePath}`,
        error as Error
      );
    }
  }

  /**
   * Import OpenAPI specification from a URL
   */
  async importFromUrl(url: string): Promise<OpenAPISpecification> {
    try {
      const response = await axios.get(url);
      const document = response.data;
      this.validateSpec(document);
      return this.extractSpecification(document);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof OpenAPIImportError) {
        throw error;
      }
      throw new OpenAPIImportError(
        `Failed to import OpenAPI spec from URL: ${url}`,
        error as Error
      );
    }
  }

  /**
   * Detect file format from extension
   */
  private detectFormat(filePath: string): 'json' | 'yaml' {
    const ext = filePath.toLowerCase();
    if (ext.endsWith('.yaml') || ext.endsWith('.yml')) {
      return 'yaml';
    }
    return 'json';
  }

  /**
   * Parse document content
   */
  private parseDocument(content: string, format: 'json' | 'yaml'): any {
    try {
      if (format === 'yaml') {
        return yaml.parse(content);
      }
      return JSON.parse(content);
    } catch (error) {
      throw new OpenAPIImportError('Failed to parse document', error as Error);
    }
  }

  /**
   * Validate OpenAPI specification
   */
  private validateSpec(document: any): void {
    const errors: string[] = [];

    if (!document.openapi) {
      errors.push('Missing required field: openapi');
    }

    if (!document.info) {
      errors.push('Missing required field: info');
    } else {
      if (!document.info.title) {
        errors.push('Missing required field: info.title');
      }
      if (!document.info.version) {
        errors.push('Missing required field: info.version');
      }
    }

    if (!document.paths) {
      errors.push('Missing required field: paths');
    }

    if (errors.length > 0) {
      throw new ValidationError('OpenAPI specification validation failed', errors);
    }
  }

  /**
   * Extract specification data
   */
  private extractSpecification(document: any): OpenAPISpecification {
    return {
      info: this.extractInfo(document.info),
      endpoints: this.extractEndpoints(document),
      components: this.extractComponents(document.components),
      raw: document,
    };
  }

  /**
   * Extract API info
   */
  private extractInfo(info: any): APIInfo {
    return {
      title: info.title,
      version: info.version,
      description: info.description,
    };
  }

  /**
   * Extract all endpoints
   */
  private extractEndpoints(document: any): Endpoint[] {
    const endpoints: Endpoint[] = [];
    const paths = document.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        const operation = (pathItem as any)[method.toLowerCase()];
        if (operation) {
          endpoints.push(this.extractEndpoint(path, method, operation));
        }
      }
    }

    return endpoints;
  }

  /**
   * Extract single endpoint
   */
  private extractEndpoint(path: string, method: HTTPMethod, operation: any): Endpoint {
    return {
      path,
      method,
      operationId: operation.operationId,
      summary: operation.summary,
      parameters: this.extractParameters(operation.parameters || []),
      requestBody: this.extractRequestBody(operation.requestBody),
      responses: this.extractResponses(operation.responses || {}),
    };
  }

  /**
   * Extract parameters
   */
  private extractParameters(parameters: any[]): Parameter[] {
    return parameters.map((param) => ({
      name: param.name,
      in: param.in,
      required: param.required || false,
      schema: param.schema || { type: 'string' },
      description: param.description,
    }));
  }

  /**
   * Extract request body
   */
  private extractRequestBody(requestBody: any): RequestBody | undefined {
    if (!requestBody) {
      return undefined;
    }

    const content: MediaType[] = [];
    for (const [mimeType, mediaTypeObj] of Object.entries(requestBody.content || {})) {
      content.push({
        mimeType,
        schema: (mediaTypeObj as any).schema,
      });
    }

    return {
      required: requestBody.required || false,
      content,
    };
  }

  /**
   * Extract responses
   */
  private extractResponses(responses: any): ResponseSchema[] {
    const result: ResponseSchema[] = [];

    for (const [statusCode, response] of Object.entries(responses)) {
      const content: MediaType[] = [];

      if ((response as any).content) {
        for (const [mimeType, mediaTypeObj] of Object.entries((response as any).content)) {
          content.push({
            mimeType,
            schema: (mediaTypeObj as any).schema,
          });
        }
      }

      result.push({
        statusCode,
        description: (response as any).description || '',
        content: content.length > 0 ? content : undefined,
      });
    }

    return result;
  }

  /**
   * Extract components
   */
  private extractComponents(components: any): Components | undefined {
    if (!components) {
      return undefined;
    }

    return {
      schemas: components.schemas,
      parameters: components.parameters,
      responses: components.responses,
    };
  }
}
