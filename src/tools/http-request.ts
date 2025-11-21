import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Request configuration interface
 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

/**
 * Response interface
 */
export interface Response {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, any>;
}

/**
 * Create a request configuration object
 */
export function createRequest(config: RequestConfig): AxiosRequestConfig {
  return {
    method: config.method,
    url: config.url,
    headers: config.headers,
    params: config.params,
    data: config.data,
    timeout: config.timeout || 30000,
  };
}

/**
 * Execute an HTTP request
 */
export async function executeRequest(config: AxiosRequestConfig): Promise<Response> {
  const response: AxiosResponse = await axios.request(config);

  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Record<string, any>,
  };
}
