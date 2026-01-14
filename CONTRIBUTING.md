# Contributing to PlayVideo JavaScript SDK

Thank you for your interest in contributing to the PlayVideo JavaScript SDK!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PlayVideo-dev/playvideo-js.git
   cd playvideo-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build the SDK:
   ```bash
   npm run build
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── index.ts           # Main client export
├── client.ts          # PlayVideo client class
├── resources/         # API resource implementations
│   ├── collections.ts
│   ├── videos.ts
│   ├── webhooks.ts
│   ├── embed.ts
│   ├── apiKeys.ts
│   ├── account.ts
│   └── usage.ts
├── errors.ts          # Error classes
├── types.ts           # TypeScript type definitions
├── webhooks.ts        # Webhook signature verification
└── __tests__/         # Test files
```

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Ensure type check passes: `npm run typecheck`
7. Commit your changes: `git commit -m "Add my feature"`
8. Push to your fork: `git push origin feature/my-feature`
9. Open a Pull Request

## Code Style

- We use TypeScript for type safety
- Follow existing code patterns and conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Pull Request Guidelines

- Include a clear description of the changes
- Reference any related issues
- Add tests for new functionality
- Update documentation if needed
- Keep PRs focused on a single change

## Reporting Issues

When reporting issues, please include:

- SDK version
- Node.js version
- Operating system
- Minimal code to reproduce the issue
- Expected vs actual behavior

## Questions?

If you have questions, feel free to open an issue or reach out at support@playvideo.dev.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
