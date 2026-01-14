/**
 * Collections Resource
 */

import type { HttpClient } from "../http.js";
import type {
  Collection,
  CollectionListResponse,
  CollectionWithVideos,
  CreateCollectionParams,
} from "../types.js";

export class CollectionsResource {
  constructor(private http: HttpClient) {}

  /**
   * List all collections
   */
  async list(): Promise<CollectionListResponse> {
    return this.http.get<CollectionListResponse>("/collections");
  }

  /**
   * Get a collection by slug
   */
  async get(slug: string): Promise<CollectionWithVideos> {
    return this.http.get<CollectionWithVideos>(`/collections/${encodeURIComponent(slug)}`);
  }

  /**
   * Create a new collection
   */
  async create(params: CreateCollectionParams): Promise<Collection> {
    return this.http.post<Collection>("/collections", params);
  }

  /**
   * Delete a collection
   */
  async delete(slug: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/collections/${encodeURIComponent(slug)}`);
  }
}
