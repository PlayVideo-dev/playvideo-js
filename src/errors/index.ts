/**
 * PlayVideo SDK Error Classes
 */

export interface PlayVideoErrorOptions {
  message: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  param?: string;
  retryAfter?: number;
}

/**
 * Base error class for all PlayVideo SDK errors
 */
export class PlayVideoError extends Error {
  readonly code?: string;
  readonly statusCode?: number;
  readonly requestId?: string;
  readonly param?: string;

  constructor(options: PlayVideoErrorOptions) {
    super(options.message);
    this.name = "PlayVideoError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;
    this.param = options.param;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication error - Invalid or missing API key (401)
 */
export class AuthenticationError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super({ ...options, statusCode: 401 });
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error - Insufficient permissions (403)
 */
export class AuthorizationError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super({ ...options, statusCode: 403 });
    this.name = "AuthorizationError";
  }
}

/**
 * Not found error - Resource doesn't exist (404)
 */
export class NotFoundError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super({ ...options, statusCode: 404 });
    this.name = "NotFoundError";
  }
}

/**
 * Validation error - Invalid request parameters (400/422)
 */
export class ValidationError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode"> & { statusCode?: number }) {
    super({ ...options, statusCode: options.statusCode ?? 400 });
    this.name = "ValidationError";
  }
}

/**
 * Conflict error - Resource conflict (409)
 */
export class ConflictError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super({ ...options, statusCode: 409 });
    this.name = "ConflictError";
  }
}

/**
 * Rate limit error - Too many requests (429)
 */
export class RateLimitError extends PlayVideoError {
  readonly retryAfter?: number;

  constructor(options: Omit<PlayVideoErrorOptions, "statusCode"> & { retryAfter?: number }) {
    super({ ...options, statusCode: 429 });
    this.name = "RateLimitError";
    this.retryAfter = options.retryAfter;
  }
}

/**
 * Server error - Internal server error (5xx)
 */
export class ServerError extends PlayVideoError {
  constructor(options: PlayVideoErrorOptions) {
    super(options);
    this.name = "ServerError";
  }
}

/**
 * Network error - Connection issues
 */
export class NetworkError extends PlayVideoError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super({ ...options, statusCode: undefined });
    this.name = "NetworkError";
  }
}

/**
 * Timeout error - Request timed out
 */
export class TimeoutError extends NetworkError {
  constructor(options: Omit<PlayVideoErrorOptions, "statusCode">) {
    super(options);
    this.name = "TimeoutError";
  }
}

/**
 * Webhook signature verification error
 */
export class WebhookSignatureError extends PlayVideoError {
  constructor(message: string = "Invalid webhook signature") {
    super({ message, code: "webhook_signature_error" });
    this.name = "WebhookSignatureError";
  }
}

/**
 * Parse API error response and throw appropriate error class
 */
export function parseApiError(
  status: number,
  body: { error?: string; message?: string; code?: string; param?: string },
  requestId?: string
): never {
  const message = body.message || body.error || `HTTP ${status}`;
  const options: PlayVideoErrorOptions = {
    message,
    code: body.code,
    statusCode: status,
    requestId,
    param: body.param,
  };

  switch (status) {
    case 401:
      throw new AuthenticationError(options);
    case 403:
      throw new AuthorizationError(options);
    case 404:
      throw new NotFoundError(options);
    case 409:
      throw new ConflictError(options);
    case 429:
      throw new RateLimitError(options);
    case 400:
    case 422:
      throw new ValidationError({ ...options, statusCode: status });
    default:
      if (status >= 500) {
        throw new ServerError(options);
      }
      throw new PlayVideoError(options);
  }
}
