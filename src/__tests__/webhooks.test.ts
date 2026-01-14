import { describe, it, expect } from "vitest";
import {
  verifyWebhookSignature,
  constructEvent,
  WebhookSignatureError,
} from "../webhooks.js";

describe("Webhook Signature Verification", () => {
  const secret = "whsec_test_secret_key";
  const payload = JSON.stringify({
    event: "video.completed",
    timestamp: Date.now(),
    data: { videoId: "vid123" },
  });

  // Helper to compute expected signature
  async function computeSignature(
    payload: string,
    timestamp: number,
    secret: string
  ): Promise<string> {
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(signedPayload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  describe("verifyWebhookSignature", () => {
    it("should verify a valid signature", async () => {
      const timestamp = Date.now();
      const sig = await computeSignature(payload, timestamp, secret);

      const result = await verifyWebhookSignature(
        payload,
        `sha256=${sig}`,
        timestamp,
        secret
      );

      expect(result).toBe(true);
    });

    it("should verify signature with string timestamp", async () => {
      const timestamp = Date.now();
      const sig = await computeSignature(payload, timestamp, secret);

      const result = await verifyWebhookSignature(
        payload,
        `sha256=${sig}`,
        String(timestamp),
        secret
      );

      expect(result).toBe(true);
    });

    it("should verify signature with object payload", async () => {
      const payloadObj = { event: "video.completed", data: { videoId: "vid1" } };
      const payloadStr = JSON.stringify(payloadObj);
      const timestamp = Date.now();
      const sig = await computeSignature(payloadStr, timestamp, secret);

      const result = await verifyWebhookSignature(
        payloadObj,
        `sha256=${sig}`,
        timestamp,
        secret
      );

      expect(result).toBe(true);
    });

    it("should throw on missing signature", async () => {
      const timestamp = Date.now();

      await expect(
        verifyWebhookSignature(payload, "", timestamp, secret)
      ).rejects.toThrow(WebhookSignatureError);
    });

    it("should throw on missing timestamp", async () => {
      await expect(
        verifyWebhookSignature(payload, "sha256=abc", "", secret)
      ).rejects.toThrow(WebhookSignatureError);
    });

    it("should throw on missing secret", async () => {
      const timestamp = Date.now();

      await expect(
        verifyWebhookSignature(payload, "sha256=abc", timestamp, "")
      ).rejects.toThrow(WebhookSignatureError);
    });

    it("should throw on invalid timestamp format", async () => {
      await expect(
        verifyWebhookSignature(payload, "sha256=abc", "not-a-number", secret)
      ).rejects.toThrow(WebhookSignatureError);
    });

    it("should throw on old timestamp", async () => {
      const oldTimestamp = Date.now() - 400 * 1000; // 400 seconds ago
      const sig = await computeSignature(payload, oldTimestamp, secret);

      await expect(
        verifyWebhookSignature(
          payload,
          `sha256=${sig}`,
          oldTimestamp,
          secret,
          300 // 5 minute tolerance
        )
      ).rejects.toThrow(/too old/);
    });

    it("should throw on future timestamp beyond tolerance", async () => {
      const futureTimestamp = Date.now() + 400 * 1000; // 400 seconds in future
      const sig = await computeSignature(payload, futureTimestamp, secret);

      await expect(
        verifyWebhookSignature(
          payload,
          `sha256=${sig}`,
          futureTimestamp,
          secret,
          300
        )
      ).rejects.toThrow(/too old/);
    });

    it("should accept custom tolerance", async () => {
      const timestamp = Date.now() - 500 * 1000; // 500 seconds ago
      const sig = await computeSignature(payload, timestamp, secret);

      // Should fail with 5 minute tolerance
      await expect(
        verifyWebhookSignature(payload, `sha256=${sig}`, timestamp, secret, 300)
      ).rejects.toThrow(WebhookSignatureError);

      // Should pass with 10 minute tolerance
      const result = await verifyWebhookSignature(
        payload,
        `sha256=${sig}`,
        timestamp,
        secret,
        600
      );
      expect(result).toBe(true);
    });

    it("should throw on invalid signature format", async () => {
      const timestamp = Date.now();

      await expect(
        verifyWebhookSignature(payload, "invalid_format", timestamp, secret)
      ).rejects.toThrow(/Invalid signature format/);
    });

    it("should throw on non-sha256 algorithm", async () => {
      const timestamp = Date.now();

      await expect(
        verifyWebhookSignature(payload, "md5=abc123", timestamp, secret)
      ).rejects.toThrow(/Invalid signature format/);
    });

    it("should throw on signature mismatch", async () => {
      const timestamp = Date.now();

      await expect(
        verifyWebhookSignature(
          payload,
          "sha256=invalid_signature_here",
          timestamp,
          secret
        )
      ).rejects.toThrow(/Signature mismatch/);
    });

    it("should throw on tampered payload", async () => {
      const timestamp = Date.now();
      const sig = await computeSignature(payload, timestamp, secret);

      const tamperedPayload = JSON.stringify({
        event: "video.completed",
        data: { videoId: "different_id" },
      });

      await expect(
        verifyWebhookSignature(
          tamperedPayload,
          `sha256=${sig}`,
          timestamp,
          secret
        )
      ).rejects.toThrow(/Signature mismatch/);
    });

    it("should throw on wrong secret", async () => {
      const timestamp = Date.now();
      const sig = await computeSignature(payload, timestamp, secret);

      await expect(
        verifyWebhookSignature(
          payload,
          `sha256=${sig}`,
          timestamp,
          "wrong_secret"
        )
      ).rejects.toThrow(/Signature mismatch/);
    });
  });

  describe("constructEvent", () => {
    it("should verify and parse a valid webhook event", async () => {
      const eventPayload = {
        event: "video.completed",
        timestamp: Date.now(),
        data: { videoId: "vid123", playlistUrl: "https://cdn.example.com/vid123/playlist.m3u8" },
      };
      const payloadStr = JSON.stringify(eventPayload);
      const timestamp = Date.now();
      const sig = await computeSignature(payloadStr, timestamp, secret);

      const event = await constructEvent(
        payloadStr,
        `sha256=${sig}`,
        timestamp,
        secret
      );

      expect(event.event).toBe("video.completed");
      expect(event.data.videoId).toBe("vid123");
    });

    it("should parse object payload", async () => {
      const eventPayload = {
        event: "video.failed",
        timestamp: Date.now(),
        data: { videoId: "vid456", error: "Transcoding failed" },
      };
      const payloadStr = JSON.stringify(eventPayload);
      const timestamp = Date.now();
      const sig = await computeSignature(payloadStr, timestamp, secret);

      const event = await constructEvent(
        eventPayload,
        `sha256=${sig}`,
        timestamp,
        secret
      );

      expect(event.event).toBe("video.failed");
      expect(event.data.error).toBe("Transcoding failed");
    });

    it("should throw WebhookSignatureError on invalid signature", async () => {
      const timestamp = Date.now();

      await expect(
        constructEvent(payload, "sha256=invalid", timestamp, secret)
      ).rejects.toThrow(WebhookSignatureError);
    });
  });

  describe("WebhookSignatureError", () => {
    it("should have correct name", () => {
      const error = new WebhookSignatureError("Test message");
      expect(error.name).toBe("WebhookSignatureError");
    });

    it("should have correct message", () => {
      const error = new WebhookSignatureError("Custom error message");
      expect(error.message).toBe("Custom error message");
    });

    it("should have default message", () => {
      const error = new WebhookSignatureError();
      expect(error.message).toBe("Invalid webhook signature");
    });

    it("should be instanceof Error", () => {
      const error = new WebhookSignatureError();
      expect(error).toBeInstanceOf(Error);
    });
  });
});
