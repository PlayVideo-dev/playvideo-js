/**
 * PlayVideo SDK Types
 */

// ============================================
// Common Types
// ============================================

export type VideoStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type Plan = "FREE" | "PRO" | "BUSINESS";
export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WebhookEvent =
  | "video.uploaded"
  | "video.processing"
  | "video.completed"
  | "video.failed"
  | "collection.created"
  | "collection.deleted";

// ============================================
// Collection Types
// ============================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  videoCount: number;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithVideos extends Collection {
  videos: Video[];
}

export interface CollectionListResponse {
  collections: Collection[];
}

export interface CreateCollectionParams {
  name: string;
  description?: string;
}

// ============================================
// Video Types
// ============================================

export interface Video {
  id: string;
  filename: string;
  status: VideoStatus;
  duration: number | null;
  originalSize: number;
  processedSize: number | null;
  playlistUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  resolutions: string[];
  errorMessage: string | null;
  collection?: {
    slug: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VideoListResponse {
  videos: Video[];
}

export interface VideoListParams {
  collection?: string;
  status?: VideoStatus;
  limit?: number;
  offset?: number;
}

export interface UploadResponse {
  message: string;
  video: {
    id: string;
    filename: string;
    status: VideoStatus;
    collection: string;
  };
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface VideoEmbedInfo {
  videoId: string;
  signature: string;
  embedPath: string;
}

// ============================================
// Progress Streaming Types
// ============================================

export type ProgressStage = "pending" | "processing" | "completed" | "failed" | "timeout";

export interface ProgressEvent {
  stage: ProgressStage;
  message?: string;
  error?: string;
  playlistUrl?: string;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  duration?: number;
  processedSize?: number | null;
  resolutions?: string[];
}

// ============================================
// Webhook Types
// ============================================

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookWithSecret extends Webhook {
  secret: string;
}

export interface WebhookListResponse {
  webhooks: Webhook[];
  availableEvents: WebhookEvent[];
}

export interface WebhookDelivery {
  id: string;
  event: WebhookEvent;
  statusCode: number | null;
  error: string | null;
  attemptCount: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface WebhookWithDeliveries extends Webhook {
  recentDeliveries: WebhookDelivery[];
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookParams {
  url?: string;
  events?: WebhookEvent[];
  isActive?: boolean;
}

export interface CreateWebhookResponse {
  message: string;
  webhook: WebhookWithSecret;
}

export interface TestWebhookResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

// ============================================
// Embed Types
// ============================================

export interface EmbedSettings {
  allowedDomains: string[];
  allowLocalhost: boolean;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoPosition: LogoPosition;
  logoOpacity: number;
  showPlaybackSpeed: boolean;
  showQualitySelector: boolean;
  showFullscreen: boolean;
  showVolume: boolean;
  showProgress: boolean;
  showTime: boolean;
  showKeyboardHints: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
}

export interface UpdateEmbedSettingsParams extends Partial<EmbedSettings> {}

export interface UpdateEmbedSettingsResponse {
  message: string;
  settings: EmbedSettings;
}

export interface SignEmbedParams {
  videoId: string;
  baseUrl?: string;
}

export interface SignEmbedResponse {
  videoId: string;
  signature: string;
  embedUrl: string;
  embedCode: {
    responsive: string;
    fixed: string;
  };
}

// ============================================
// API Key Types
// ============================================

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyWithKey extends ApiKey {
  key: string;
}

export interface ApiKeyListResponse {
  apiKeys: ApiKey[];
}

export interface CreateApiKeyParams {
  name: string;
}

export interface CreateApiKeyResponse {
  message: string;
  apiKey: ApiKeyWithKey;
}

// ============================================
// Account Types
// ============================================

export interface Account {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  allowedDomains: string[];
  allowLocalhost: boolean;
  r2BucketName: string | null;
  r2BucketRegion: string | null;
  createdAt: string;
}

export interface UpdateAccountParams {
  allowedDomains?: string[];
  allowLocalhost?: boolean;
}

export interface UpdateAccountResponse {
  message: string;
  account: Account;
}

// ============================================
// Usage Types
// ============================================

export interface Usage {
  plan: Plan;
  usage: {
    videosThisMonth: number;
    videosLimit: number | "unlimited";
    storageUsedBytes: number;
    storageUsedGB: string;
    storageLimitGB: number;
  };
  limits: {
    maxFileSizeMB: number;
    maxDurationMinutes: number;
    resolutions: string[];
    apiAccess: boolean;
    webhooks: boolean;
    deliveryGB: number;
  };
}

// ============================================
// Client Options
// ============================================

export interface PlayVideoOptions {
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

// ============================================
// API Error Response
// ============================================

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
  param?: string;
  requestId?: string;
}
