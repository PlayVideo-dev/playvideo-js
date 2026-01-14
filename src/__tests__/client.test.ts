import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PlayVideo from "../index.js";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from "../errors/index.js";

describe("PlayVideo Client", () => {
  const mockFetch = vi.fn();
  let client: PlayVideo;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new PlayVideo("play_test_xxx", {
      fetch: mockFetch as unknown as typeof fetch,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create a client with API key", () => {
      const c = new PlayVideo("play_live_abc123");
      expect(c).toBeDefined();
      expect(c.collections).toBeDefined();
      expect(c.videos).toBeDefined();
      expect(c.webhooks).toBeDefined();
      expect(c.embed).toBeDefined();
      expect(c.apiKeys).toBeDefined();
      expect(c.account).toBeDefined();
      expect(c.usage).toBeDefined();
    });

    it("should accept custom baseUrl", () => {
      const c = new PlayVideo("play_test_xxx", {
        baseUrl: "https://custom.api.com/v1",
      });
      expect(c).toBeDefined();
    });

    it("should accept custom timeout", () => {
      const c = new PlayVideo("play_test_xxx", {
        timeout: 60000,
      });
      expect(c).toBeDefined();
    });

    it("should throw error if API key is missing", () => {
      expect(() => new PlayVideo("")).toThrow("API key is required");
    });
  });

  describe("Collections", () => {
    it("should list collections", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          collections: [
            { id: "col1", name: "Test", slug: "test", videoCount: 5 },
          ],
        }),
      });

      const result = await client.collections.list();
      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].slug).toBe("test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.playvideo.dev/api/v1/collections",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer play_test_xxx",
          }),
        })
      );
    });

    it("should create a collection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: "col1",
          name: "My Videos",
          slug: "my-videos",
          description: "Test description",
        }),
      });

      const result = await client.collections.create({
        name: "My Videos",
        description: "Test description",
      });

      expect(result.slug).toBe("my-videos");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.playvideo.dev/api/v1/collections",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "My Videos",
            description: "Test description",
          }),
        })
      );
    });

    it("should get a collection by slug", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: "col1",
          name: "Test",
          slug: "test",
          videos: [{ id: "vid1", filename: "test.mp4" }],
        }),
      });

      const result = await client.collections.get("test");
      expect(result.slug).toBe("test");
      expect(result.videos).toHaveLength(1);
    });

    it("should delete a collection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ message: "Collection deleted" }),
      });

      const result = await client.collections.delete("test");
      expect(result.message).toBe("Collection deleted");
    });
  });

  describe("Videos", () => {
    it("should list videos", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          videos: [
            { id: "vid1", filename: "test.mp4", status: "COMPLETED" },
          ],
        }),
      });

      const result = await client.videos.list();
      expect(result.videos).toHaveLength(1);
    });

    it("should list videos with filters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ videos: [] }),
      });

      await client.videos.list({
        collection: "my-collection",
        status: "COMPLETED",
        limit: 10,
        offset: 0,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("collection=my-collection"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=COMPLETED"),
        expect.any(Object)
      );
    });

    it("should get a video by ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: "vid1",
          filename: "test.mp4",
          status: "COMPLETED",
          playlistUrl: "https://cdn.example.com/vid1/playlist.m3u8",
        }),
      });

      const result = await client.videos.get("vid1");
      expect(result.id).toBe("vid1");
      expect(result.playlistUrl).toBeDefined();
    });

    it("should delete a video", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ message: "Video deleted" }),
      });

      const result = await client.videos.delete("vid1");
      expect(result.message).toBe("Video deleted");
    });

    it("should get embed info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          videoId: "vid1",
          signature: "sig123",
          embedPath: "/embed/vid1",
        }),
      });

      const result = await client.videos.getEmbedInfo("vid1");
      expect(result.videoId).toBe("vid1");
      expect(result.signature).toBe("sig123");
    });

    it("should upload a video", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "Video uploaded",
          video: {
            id: "vid1",
            filename: "test.mp4",
            status: "PENDING",
            collection: "my-collection",
          },
        }),
      });

      const blob = new Blob(["test content"], { type: "video/mp4" });
      const result = await client.videos.upload(
        blob,
        "my-collection",
        "test.mp4"
      );

      expect(result.video.id).toBe("vid1");
      expect(result.video.status).toBe("PENDING");
    });
  });

  describe("Webhooks", () => {
    it("should list webhooks", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          webhooks: [
            { id: "wh1", url: "https://example.com/webhook", events: ["video.completed"] },
          ],
          availableEvents: ["video.uploaded", "video.completed", "video.failed"],
        }),
      });

      const result = await client.webhooks.list();
      expect(result.webhooks).toHaveLength(1);
      expect(result.availableEvents).toContain("video.completed");
    });

    it("should create a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "Webhook created",
          webhook: {
            id: "wh1",
            url: "https://example.com/webhook",
            events: ["video.completed"],
            secret: "whsec_test123",
          },
        }),
      });

      const result = await client.webhooks.create({
        url: "https://example.com/webhook",
        events: ["video.completed"],
      });

      expect(result.webhook.secret).toBe("whsec_test123");
    });

    it("should update a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: "wh1",
          url: "https://example.com/webhook",
          events: ["video.completed", "video.failed"],
          isActive: false,
        }),
      });

      const result = await client.webhooks.update("wh1", {
        events: ["video.completed", "video.failed"],
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it("should test a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "Test event sent",
          statusCode: 200,
        }),
      });

      const result = await client.webhooks.test("wh1");
      expect(result.statusCode).toBe(200);
    });

    it("should delete a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ message: "Webhook deleted" }),
      });

      const result = await client.webhooks.delete("wh1");
      expect(result.message).toBe("Webhook deleted");
    });
  });

  describe("Embed", () => {
    it("should get embed settings", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          allowedDomains: ["example.com"],
          allowLocalhost: true,
          primaryColor: "#FF0000",
          autoplay: false,
        }),
      });

      const result = await client.embed.getSettings();
      expect(result.allowedDomains).toContain("example.com");
      expect(result.primaryColor).toBe("#FF0000");
    });

    it("should update embed settings", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "Settings updated",
          settings: {
            primaryColor: "#00FF00",
            autoplay: true,
          },
        }),
      });

      const result = await client.embed.updateSettings({
        primaryColor: "#00FF00",
        autoplay: true,
      });

      expect(result.settings.primaryColor).toBe("#00FF00");
    });

    it("should sign an embed URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          videoId: "vid1",
          signature: "sig123",
          embedUrl: "https://embed.playvideo.dev/vid1?sig=sig123",
          embedCode: {
            responsive: '<div style="..."><iframe src="..."></iframe></div>',
            fixed: '<iframe src="..." width="640" height="360"></iframe>',
          },
        }),
      });

      const result = await client.embed.sign({ videoId: "vid1" });
      expect(result.embedUrl).toContain("vid1");
      expect(result.signature).toBe("sig123");
    });
  });

  describe("API Keys", () => {
    it("should list API keys", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          apiKeys: [
            { id: "key1", name: "Production", keyPrefix: "play_live_abc" },
          ],
        }),
      });

      const result = await client.apiKeys.list();
      expect(result.apiKeys).toHaveLength(1);
      expect(result.apiKeys[0].keyPrefix).toBe("play_live_abc");
    });

    it("should create an API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "API key created",
          apiKey: {
            id: "key1",
            name: "New Key",
            keyPrefix: "play_live_xyz",
            key: "play_live_xyz123456789",
          },
        }),
      });

      const result = await client.apiKeys.create({ name: "New Key" });
      expect(result.apiKey.key).toBe("play_live_xyz123456789");
    });

    it("should delete an API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ message: "API key deleted" }),
      });

      const result = await client.apiKeys.delete("key1");
      expect(result.message).toBe("API key deleted");
    });
  });

  describe("Account", () => {
    it("should get account info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: "acc1",
          email: "user@example.com",
          plan: "PRO",
          allowedDomains: ["example.com"],
        }),
      });

      const result = await client.account.get();
      expect(result.email).toBe("user@example.com");
      expect(result.plan).toBe("PRO");
    });

    it("should update account", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          message: "Account updated",
          account: {
            allowedDomains: ["example.com", "test.com"],
            allowLocalhost: true,
          },
        }),
      });

      const result = await client.account.update({
        allowedDomains: ["example.com", "test.com"],
        allowLocalhost: true,
      });

      expect(result.account.allowedDomains).toContain("test.com");
    });
  });

  describe("Usage", () => {
    it("should get usage info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          plan: "PRO",
          usage: {
            videosThisMonth: 50,
            videosLimit: 500,
            storageUsedBytes: 1073741824,
            storageUsedGB: "1.00",
            storageLimitGB: 100,
          },
          limits: {
            maxFileSizeMB: 500,
            maxDurationMinutes: 60,
            resolutions: ["1080p", "720p", "480p"],
            apiAccess: true,
            webhooks: true,
          },
        }),
      });

      const result = await client.usage.get();
      expect(result.plan).toBe("PRO");
      expect(result.usage.videosThisMonth).toBe(50);
      expect(result.limits.apiAccess).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw AuthenticationError for 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ "x-request-id": "req123" }),
        json: async () => ({
          error: "Unauthorized",
          message: "Invalid API key",
        }),
      });

      await expect(client.collections.list()).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should throw AuthorizationError for 403", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
        json: async () => ({
          error: "Forbidden",
          message: "Insufficient permissions",
        }),
      });

      await expect(client.webhooks.list()).rejects.toThrow(AuthorizationError);
    });

    it("should throw NotFoundError for 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({
          error: "Not Found",
          message: "Video not found",
        }),
      });

      await expect(client.videos.get("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw ValidationError for 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          error: "Bad Request",
          message: "Invalid collection name",
          param: "name",
        }),
      });

      await expect(
        client.collections.create({ name: "" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw RateLimitError for 429", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: async () => ({
          error: "Too Many Requests",
          message: "Rate limit exceeded",
        }),
      });

      await expect(client.videos.list()).rejects.toThrow(RateLimitError);
    });

    it("should throw ServerError for 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({
          error: "Internal Server Error",
          message: "Something went wrong",
        }),
      });

      await expect(client.account.get()).rejects.toThrow(ServerError);
    });

    it("should include requestId in error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ "x-request-id": "req-abc-123" }),
        json: async () => ({
          error: "Not Found",
          message: "Video not found",
        }),
      });

      try {
        await client.videos.get("nonexistent");
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundError);
        expect((e as NotFoundError).requestId).toBe("req-abc-123");
      }
    });
  });
});
