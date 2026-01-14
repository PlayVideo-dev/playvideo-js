/**
 * PlayVideo SDK for JavaScript/TypeScript
 *
 * Official SDK for the PlayVideo API - Video hosting for developers.
 *
 * @example
 * ```typescript
 * import PlayVideo from 'playvideo';
 *
 * const client = new PlayVideo('play_live_xxx');
 *
 * // List collections
 * const { collections } = await client.collections.list();
 *
 * // Upload a video
 * const video = await client.videos.uploadFile('./video.mp4', 'my-collection');
 *
 * // Watch processing progress
 * for await (const event of client.videos.watchProgress(video.video.id)) {
 *   console.log(event.stage, event.message);
 * }
 * ```
 *
 * @packageDocumentation
 */

import { HttpClient } from "./http.js";
import { CollectionsResource } from "./resources/collections.js";
import { VideosResource } from "./resources/videos.js";
import { WebhooksResource } from "./resources/webhooks.js";
import { EmbedResource } from "./resources/embed.js";
import { ApiKeysResource } from "./resources/api-keys.js";
import { AccountResource } from "./resources/account.js";
import { UsageResource } from "./resources/usage.js";

// Re-export types
export * from "./types.js";

// Re-export errors
export {
  PlayVideoError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  ServerError,
  NetworkError,
  TimeoutError,
  WebhookSignatureError,
} from "./errors/index.js";

/**
 * PlayVideo client options
 */
export interface PlayVideoOptions {
  /**
   * Base URL for the API (default: https://api.playvideo.dev/api/v1)
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Custom fetch implementation (default: globalThis.fetch)
   */
  fetch?: typeof fetch;
}

/**
 * PlayVideo API client
 *
 * @example
 * ```typescript
 * const client = new PlayVideo('play_live_xxx');
 *
 * // With options
 * const client = new PlayVideo('play_live_xxx', {
 *   baseUrl: 'https://api.playvideo.dev/api/v1',
 *   timeout: 60000,
 * });
 * ```
 */
export class PlayVideo {
  private http: HttpClient;

  /**
   * Collections API
   */
  readonly collections: CollectionsResource;

  /**
   * Videos API
   */
  readonly videos: VideosResource;

  /**
   * Webhooks API (requires PRO or BUSINESS plan)
   */
  readonly webhooks: WebhooksResource;

  /**
   * Embed settings API
   */
  readonly embed: EmbedResource;

  /**
   * API Keys API
   */
  readonly apiKeys: ApiKeysResource;

  /**
   * Account API
   */
  readonly account: AccountResource;

  /**
   * Usage and limits API
   */
  readonly usage: UsageResource;

  /**
   * Create a new PlayVideo client
   *
   * @param apiKey - Your PlayVideo API key (play_live_xxx or play_test_xxx)
   * @param options - Client options
   */
  constructor(apiKey: string, options?: PlayVideoOptions) {
    this.http = new HttpClient({
      apiKey,
      baseUrl: options?.baseUrl,
      timeout: options?.timeout,
      fetch: options?.fetch,
    });

    this.collections = new CollectionsResource(this.http);
    this.videos = new VideosResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.embed = new EmbedResource(this.http);
    this.apiKeys = new ApiKeysResource(this.http);
    this.account = new AccountResource(this.http);
    this.usage = new UsageResource(this.http);
  }
}

// Default export
export default PlayVideo;
