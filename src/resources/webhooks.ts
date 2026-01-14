/**
 * Webhooks Resource
 */

import type { HttpClient } from "../http.js";
import type {
  Webhook,
  WebhookListResponse,
  WebhookWithDeliveries,
  CreateWebhookParams,
  CreateWebhookResponse,
  UpdateWebhookParams,
  TestWebhookResponse,
} from "../types.js";

export class WebhooksResource {
  constructor(private http: HttpClient) {}

  /**
   * List all webhooks
   */
  async list(): Promise<WebhookListResponse> {
    return this.http.get<WebhookListResponse>("/webhooks");
  }

  /**
   * Get a webhook by ID with recent deliveries
   */
  async get(id: string): Promise<WebhookWithDeliveries> {
    return this.http.get<WebhookWithDeliveries>(`/webhooks/${encodeURIComponent(id)}`);
  }

  /**
   * Create a new webhook
   *
   * Note: The webhook secret is only returned once in the response.
   * Store it securely for signature verification.
   */
  async create(params: CreateWebhookParams): Promise<CreateWebhookResponse> {
    return this.http.post<CreateWebhookResponse>("/webhooks", params);
  }

  /**
   * Update a webhook
   */
  async update(id: string, params: UpdateWebhookParams): Promise<Webhook> {
    return this.http.patch<Webhook>(`/webhooks/${encodeURIComponent(id)}`, params);
  }

  /**
   * Test a webhook by sending a test event
   */
  async test(id: string): Promise<TestWebhookResponse> {
    return this.http.post<TestWebhookResponse>(`/webhooks/${encodeURIComponent(id)}/test`, {});
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/webhooks/${encodeURIComponent(id)}`);
  }
}
