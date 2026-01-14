/**
 * API Keys Resource
 */

import type { HttpClient } from "../http.js";
import type {
  ApiKeyListResponse,
  CreateApiKeyParams,
  CreateApiKeyResponse,
} from "../types.js";

export class ApiKeysResource {
  constructor(private http: HttpClient) {}

  /**
   * List all API keys
   */
  async list(): Promise<ApiKeyListResponse> {
    return this.http.get<ApiKeyListResponse>("/api-keys");
  }

  /**
   * Create a new API key
   *
   * Note: The full API key is only returned once in the response.
   * Store it securely.
   */
  async create(params: CreateApiKeyParams): Promise<CreateApiKeyResponse> {
    return this.http.post<CreateApiKeyResponse>("/api-keys", params);
  }

  /**
   * Delete an API key
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api-keys/${encodeURIComponent(id)}`);
  }
}
