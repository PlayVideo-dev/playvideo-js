/**
 * Webhook signature verification utilities
 *
 * Usage:
 * ```typescript
 * import { verifyWebhookSignature } from 'playvideo/webhooks';
 *
 * const isValid = await verifyWebhookSignature(payload, signature, timestamp, secret);
 * ```
 */

import { WebhookSignatureError } from "./errors/index.js";
import type { WebhookEvent } from "./types.js";

export { WebhookSignatureError };

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Verify a webhook signature
 *
 * @param payload - The raw webhook payload (string or object)
 * @param signature - The X-PlayVideo-Signature header value
 * @param timestamp - The X-PlayVideo-Timestamp header value
 * @param secret - Your webhook secret (whsec_xxx)
 * @param tolerance - Maximum age of the webhook in seconds (default: 300)
 * @returns true if valid, throws WebhookSignatureError if invalid
 */
export async function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  timestamp: string | number,
  secret: string,
  tolerance: number = 300
): Promise<boolean> {
  if (!signature || !timestamp || !secret) {
    throw new WebhookSignatureError("Missing required parameters for signature verification");
  }

  // Parse timestamp
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts)) {
    throw new WebhookSignatureError("Invalid timestamp");
  }

  // Check timestamp tolerance
  const now = Date.now();
  const age = Math.abs(now - ts) / 1000;
  if (age > tolerance) {
    throw new WebhookSignatureError(`Webhook timestamp too old (${Math.round(age)}s > ${tolerance}s)`);
  }

  // Extract signature value (format: sha256=xxx)
  const sigParts = signature.split("=");
  if (sigParts.length !== 2 || sigParts[0] !== "sha256") {
    throw new WebhookSignatureError("Invalid signature format");
  }
  const expectedSig = sigParts[1];

  // Prepare payload string
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);

  // Compute signature
  const signedPayload = `${ts}.${payloadStr}`;
  const computedSig = await computeHmacSha256(signedPayload, secret);

  // Constant-time comparison
  if (!secureCompare(expectedSig, computedSig)) {
    throw new WebhookSignatureError("Signature mismatch");
  }

  return true;
}

/**
 * Construct and verify a webhook event
 *
 * @param payload - The raw webhook payload
 * @param signature - The X-PlayVideo-Signature header
 * @param timestamp - The X-PlayVideo-Timestamp header
 * @param secret - Your webhook secret
 * @returns The parsed webhook payload
 */
export async function constructEvent(
  payload: string | object,
  signature: string,
  timestamp: string | number,
  secret: string
): Promise<WebhookPayload> {
  await verifyWebhookSignature(payload, signature, timestamp, secret);

  const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
  return parsed as WebhookPayload;
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmacSha256(message: string, secret: string): Promise<string> {
  // Use Web Crypto API (available in Node 18+ and browsers)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

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

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
