/**
 * Configuration options for API Consumer server
 */
export interface APIConsumerConfig {
  timeout?: number;
  maxConcurrentRequests?: number;
  enableMockServer?: boolean;
  testFrameworks?: string[];
}

/**
 * Server information
 */
export interface ServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

/**
 * Test execution result
 */
export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  failures?: TestFailure[];
}

/**
 * Individual test failure
 */
export interface TestFailure {
  testName: string;
  error: string;
  expected?: any;
  actual?: any;
}

/**
 * Environment configuration
 */
export interface Environment {
  name: string;
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  variables?: Record<string, string>;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: 'bearer' | 'basic' | 'apiKey' | 'oauth2';
  credentials: Record<string, string>;
}

/**
 * Test workflow definition
 */
export interface TestWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  environment?: Environment;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  type: 'request' | 'validation' | 'assertion' | 'delay';
  config: Record<string, any>;
  dependsOn?: string[];
}

/**
 * Finding structure (kept for compatibility)
 */
export interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  message: string;
  code?: string;
}

/**
 * Suggestion structure (kept for compatibility)
 */
export interface Suggestion {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  example?: string;
  impact?: string;
}

/**
 * Analysis result structure (kept for compatibility with old tools)
 */
export interface AnalysisResult {
  status: 'success' | 'error';
  tool: string;
  data: {
    summary: string;
    findings: Finding[];
    suggestions: Suggestion[];
    metrics: Record<string, any>;
  };
  metadata: {
    timestamp: string;
    duration: number;
    filesAnalyzed: number;
  };
}
