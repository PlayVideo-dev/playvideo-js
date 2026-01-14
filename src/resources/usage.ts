/**
 * Usage Resource
 */

import type { HttpClient } from "../http.js";
import type { Usage } from "../types.js";

export class UsageResource {
  constructor(private http: HttpClient) {}

  /**
   * Get usage statistics and plan limits
   */
  async get(): Promise<Usage> {
    return this.http.get<Usage>("/usage");
  }
}
