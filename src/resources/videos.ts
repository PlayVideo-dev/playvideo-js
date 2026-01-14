/**
 * Videos Resource
 */

import type { HttpClient } from "../http.js";
import type {
  Video,
  VideoListResponse,
  VideoListParams,
  UploadResponse,
  UploadOptions,
  VideoEmbedInfo,
  ProgressEvent,
} from "../types.js";
import { NetworkError } from "../errors/index.js";

export class VideosResource {
  constructor(private http: HttpClient) {}

  /**
   * List videos with optional filters
   */
  async list(params?: VideoListParams): Promise<VideoListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.collection) searchParams.set("collection", params.collection);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const query = searchParams.toString();
    return this.http.get<VideoListResponse>(`/videos${query ? `?${query}` : ""}`);
  }

  /**
   * Get a video by ID
   */
  async get(id: string): Promise<Video> {
    return this.http.get<Video>(`/videos/${encodeURIComponent(id)}`);
  }

  /**
   * Upload a video file
   *
   * @param file - File to upload (Buffer, Blob, or ReadableStream)
   * @param collection - Target collection slug
   * @param options - Upload options including progress callback
   */
  async upload(
    file: Buffer | Blob | ReadableStream<Uint8Array>,
    collection: string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResponse> {
    return this.http.upload<UploadResponse>(
      "/videos",
      file,
      collection,
      filename,
      options?.onProgress
    );
  }

  /**
   * Upload a video from a file path (Node.js only)
   */
  async uploadFile(
    filePath: string,
    collection: string,
    options?: UploadOptions
  ): Promise<UploadResponse> {
    // Dynamic import for Node.js fs module
    const fs = await import("fs");
    const path = await import("path");

    const filename = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Convert Node stream to web stream
    const { Readable } = await import("stream");
    const webStream = Readable.toWeb(fileStream) as ReadableStream<Uint8Array>;

    // Create progress tracking if callback provided
    if (options?.onProgress) {
      let loaded = 0;
      const total = stats.size;

      const trackingStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          loaded += chunk.length;
          options.onProgress!({
            loaded,
            total,
            percent: Math.round((loaded / total) * 100),
          });
          controller.enqueue(chunk);
        },
      });

      const trackedStream = webStream.pipeThrough(trackingStream);
      return this.upload(trackedStream, collection, filename);
    }

    return this.upload(webStream, collection, filename);
  }

  /**
   * Delete a video
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/videos/${encodeURIComponent(id)}`);
  }

  /**
   * Get embed information for a video
   */
  async getEmbedInfo(id: string): Promise<VideoEmbedInfo> {
    return this.http.get<VideoEmbedInfo>(`/videos/${encodeURIComponent(id)}/embed`);
  }

  /**
   * Watch video processing progress via SSE
   *
   * Returns an async iterator that yields progress events
   */
  async *watchProgress(id: string, signal?: AbortSignal): AsyncGenerator<ProgressEvent> {
    const url = `${this.http.baseUrl}/videos/${encodeURIComponent(id)}/progress`;

    const response = await this.http.fetchFn(url, {
      headers: {
        Authorization: `Bearer ${this.http.apiKey}`,
        Accept: "text/event-stream",
      },
      signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string; code?: string };
      throw new NetworkError({
        message: body.error || `HTTP ${response.status}`,
        code: body.code,
      });
    }

    if (!response.body) {
      throw new NetworkError({ message: "No response body" });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as ProgressEvent;
              yield event;

              // Stop on terminal states
              if (event.stage === "completed" || event.stage === "failed" || event.stage === "timeout") {
                return;
              }
            } catch {
              // Ignore parse errors for malformed events
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
