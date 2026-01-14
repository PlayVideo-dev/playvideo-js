/**
 * HTTP Client for PlayVideo API
 */

import { parseApiError, NetworkError, TimeoutError } from "./errors/index.js";
import type { UploadProgress } from "./types.js";

const DEFAULT_BASE_URL = "https://api.playvideo.dev/api/v1";
const DEFAULT_TIMEOUT = 30000;

export interface HttpClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export class HttpClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeout: number;
  readonly fetchFn: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.fetchFn = options.fetch || globalThis.fetch;

    if (!this.apiKey) {
      throw new Error("API key is required");
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get("x-request-id") || undefined;
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;

      if (!response.ok) {
        parseApiError(response.status, data as { error?: string; message?: string; code?: string; param?: string }, requestId);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TimeoutError({ message: `Request timed out after ${this.timeout}ms` });
        }
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new NetworkError({ message: `Network error: ${error.message}` });
        }
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>("GET", endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, body);
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint);
  }

  async upload<T>(
    endpoint: string,
    file: Buffer | Blob | ReadableStream<Uint8Array>,
    collection: string,
    filename: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // Longer timeout for uploads (10 minutes)
    const uploadTimeout = Math.max(this.timeout, 600000);
    const timeoutId = setTimeout(() => controller.abort(), uploadTimeout);

    try {
      // Create form data
      const formData = new FormData();
      
      // Handle different file input types
      let blob: Blob;
      if (file instanceof Blob) {
        blob = file;
      } else if (Buffer.isBuffer(file)) {
        blob = new Blob([file]);
      } else {
        // ReadableStream - convert to blob
        const chunks: Uint8Array[] = [];
        const reader = file.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        blob = new Blob(chunks);
      }

      formData.append("file", blob, filename);
      formData.append("collection", collection);

      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get("x-request-id") || undefined;
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;

      if (!response.ok) {
        parseApiError(response.status, data as { error?: string; message?: string; code?: string; param?: string }, requestId);
      }

      // Simulate 100% progress on completion
      if (onProgress) {
        onProgress({ loaded: 1, total: 1, percent: 100 });
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TimeoutError({ message: `Upload timed out after ${uploadTimeout}ms` });
        }
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new NetworkError({ message: `Network error: ${error.message}` });
        }
      }
      throw error;
    }
  }
}
