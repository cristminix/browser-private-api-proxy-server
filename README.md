# Browser Private API Proxy Server

This is a WebSocket Server and REST API that proxies private browser APIs for the Chrome extension. The server runs on port 4001 and provides both REST API endpoints and WebSocket connections for communication with the browser extension.

## Features

- **REST API**: Available at `http://localhost:4001/api/`
- **WebSocket Server**: Available at `ws://localhost:4001/`
- **Shared Port**: Both REST API and WebSocket run on the same port (4001)
- **Proxy Functionality**: Handles requests from the Chrome extension to access private APIs

## Endpoints

### REST API

- `GET /api/status` - Returns server status information
- `POST /api/proxy` - Accepts proxy requests from the Chrome extension

### WebSocket Messages

The WebSocket server handles different message types:

- `{ "type": "api_request", "requestId": "unique-id", "payload": { ... } }` - API requests from the extension
- `{ "type": "ping" }` - Ping messages for connection health
- `{ "type": "pong", "timestamp": 1234567890 }` - Response to ping messages
- `{ "type": "connected", "message": "..." }` - Connection confirmation
- `{ "type": "api_response", "requestId": "unique-id", "payload": { ... } }` - API responses to the extension

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm run dev
   ```

3. The server will be available at `http://localhost:4001`

### Production Build

To build the server for production:

```bash
pnpm run build
```

To start the production server:

```bash
pnpm start
```

## Development

The development server supports hot reloading:

```bash
pnpm run dev
```

This will start the server with auto-reload on code changes.

## Architecture

The server uses:
- Express.js for REST API endpoints
- ws library for WebSocket functionality
- Both running on the same HTTP server instance (port 4001)
- TypeScript for type safety
- CORS support for browser extension communication