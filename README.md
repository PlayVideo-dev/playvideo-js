# PlayVideo SDK for JavaScript/TypeScript

[![CI](https://github.com/PlayVideo-dev/playvideo-js/actions/workflows/ci.yml/badge.svg)](https://github.com/PlayVideo-dev/playvideo-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@playvideo/playvideo-sdk.svg)](https://www.npmjs.com/package/@playvideo/playvideo-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@playvideo/playvideo-sdk.svg)](https://www.npmjs.com/package/@playvideo/playvideo-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official JavaScript/TypeScript SDK for the [PlayVideo](https://playvideo.dev) API - Video hosting for developers.

## Installation

```bash
npm install @playvideo/playvideo-sdk
# or
yarn add @playvideo/playvideo-sdk
# or
pnpm add @playvideo/playvideo-sdk
```

**Requirements:** Node.js 18+ or modern browser with native `fetch` support.

## Quick Start

```typescript
import PlayVideo from '@playvideo/playvideo-sdk';

const client = new PlayVideo('play_live_xxx');

// List collections
const { collections } = await client.collections.list();

// Upload a video (Node.js)
const response = await client.videos.uploadFile('./video.mp4', 'my-collection', {
  onProgress: (progress) => console.log(`${progress.percent}%`)
});

// Watch processing progress
for await (const event of client.videos.watchProgress(response.video.id)) {
  console.log(event.stage, event.message);
  if (event.stage === 'completed') {
    console.log('Video ready:', event.playlistUrl);
    break;
  }
}
```

## Resources

### Collections

```typescript
// List all collections
const { collections } = await client.collections.list();

// Create a collection
const collection = await client.collections.create({
  name: 'My Videos',
  description: 'Tutorial videos'
});

// Get a collection with videos
const collection = await client.collections.get('my-videos');

// Delete a collection
await client.collections.delete('my-videos');
```

### Videos

```typescript
// List videos
const { videos } = await client.videos.list();

// Filter by collection or status
const { videos } = await client.videos.list({
  collection: 'my-collection',
  status: 'COMPLETED',
  limit: 50
});

// Get a video
const video = await client.videos.get('video-id');

// Upload a file (Node.js)
const response = await client.videos.uploadFile('./video.mp4', 'my-collection', {
  onProgress: ({ percent }) => console.log(`${percent}%`)
});

// Upload a Blob/Buffer (Browser or Node.js)
const response = await client.videos.upload(
  fileBlob,
  'my-collection',
  'video.mp4'
);

// Delete a video
await client.videos.delete('video-id');

// Get embed information
const embedInfo = await client.videos.getEmbedInfo('video-id');

// Watch processing progress (SSE streaming)
for await (const event of client.videos.watchProgress('video-id')) {
  switch (event.stage) {
    case 'pending':
      console.log('Waiting in queue...');
      break;
    case 'processing':
      console.log('Transcoding...');
      break;
    case 'completed':
      console.log('Done!', event.playlistUrl);
      break;
    case 'failed':
      console.error('Failed:', event.error);
      break;
  }
}
```

### Webhooks

```typescript
// List webhooks
const { webhooks, availableEvents } = await client.webhooks.list();

// Create a webhook
const { webhook } = await client.webhooks.create({
  url: 'https://example.com/webhook',
  events: ['video.completed', 'video.failed']
});
// Save webhook.secret - only shown once!

// Update a webhook
await client.webhooks.update('webhook-id', {
  events: ['video.completed'],
  isActive: false
});

// Test a webhook
const result = await client.webhooks.test('webhook-id');

// Delete a webhook
await client.webhooks.delete('webhook-id');
```

### Embed Settings

```typescript
// Get embed settings
const settings = await client.embed.getSettings();

// Update embed settings
await client.embed.updateSettings({
  primaryColor: '#FF0000',
  autoplay: true,
  muted: true
});

// Generate signed embed URL
const { embedUrl, embedCode } = await client.embed.sign({
  videoId: 'video-id'
});

console.log(embedCode.responsive); // HTML for responsive embed
```

### API Keys

```typescript
// List API keys
const { apiKeys } = await client.apiKeys.list();

// Create an API key
const { apiKey } = await client.apiKeys.create({ name: 'My App' });
// Save apiKey.key - only shown once!

// Delete an API key
await client.apiKeys.delete('key-id');
```

### Account

```typescript
// Get account info
const account = await client.account.get();

// Update allowed domains
await client.account.update({
  allowedDomains: ['example.com', 'app.example.com'],
  allowLocalhost: true
});
```

### Usage

```typescript
// Get usage statistics
const usage = await client.usage.get();

console.log(`Plan: ${usage.plan}`);
console.log(`Videos: ${usage.usage.videosThisMonth}/${usage.usage.videosLimit}`);
console.log(`Storage: ${usage.usage.storageUsedGB} GB`);
```

## Webhook Signature Verification

```typescript
import { verifyWebhookSignature, constructEvent } from 'playvideo/webhooks';

// Express.js example
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-playvideo-signature'];
  const timestamp = req.headers['x-playvideo-timestamp'];
  
  try {
    const event = await constructEvent(
      req.body,
      signature,
      timestamp,
      'whsec_xxx'
    );
    
    switch (event.event) {
      case 'video.completed':
        console.log('Video ready:', event.data);
        break;
      case 'video.failed':
        console.log('Video failed:', event.data);
        break;
    }
    
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send('Invalid signature');
  }
});
```

## Error Handling

```typescript
import PlayVideo, {
  PlayVideoError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError
} from 'playvideo';

try {
  await client.videos.get('invalid-id');
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (err instanceof NotFoundError) {
    console.error('Video not found');
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof ValidationError) {
    console.error(`Invalid param: ${err.param}`);
  } else if (err instanceof PlayVideoError) {
    console.error(`API error: ${err.message} (${err.code})`);
  }
}
```

### Error Types

| Error | Status | Description |
|-------|--------|-------------|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `AuthorizationError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 400/422 | Invalid parameters |
| `ConflictError` | 409 | Resource conflict |
| `RateLimitError` | 429 | Too many requests |
| `ServerError` | 5xx | Server error |
| `NetworkError` | - | Connection failed |
| `TimeoutError` | - | Request timed out |
| `WebhookSignatureError` | - | Invalid signature |

## Configuration

```typescript
const client = new PlayVideo('play_live_xxx', {
  // Custom base URL (for self-hosted)
  baseUrl: 'https://api.yourdomain.com/api/v1',
  
  // Request timeout (default: 30000ms)
  timeout: 60000,
  
  // Custom fetch implementation
  fetch: customFetch
});
```

## TypeScript

The SDK is written in TypeScript and includes full type definitions:

```typescript
import PlayVideo, {
  Video,
  Collection,
  VideoStatus,
  WebhookEvent
} from 'playvideo';

const video: Video = await client.videos.get('id');
const status: VideoStatus = video.status; // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
```

## License

MIT - see [LICENSE](LICENSE) for details.

## MCP Server

Use the PlayVideo MCP server to connect Claude/Desktop assistants to your account.

```bash
npm install -g @playvideo/playvideo-mcp
```

Repo: https://github.com/PlayVideo-dev/playvideo-mcp

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Links

- [Documentation](https://playvideo.dev/docs)
- [API Reference](https://playvideo.dev/docs/api)
- [Dashboard](https://playvideo.dev/dashboard)
- [GitHub](https://github.com/PlayVideo-dev/playvideo-js)
