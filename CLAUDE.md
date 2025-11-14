# Browser Private API Proxy Server

## Project Overview

This project is a WebSocket Server and REST API for proxying private browser APIs. It uses the Hono framework as the backend and provides a proxy layer for accessing browser APIs that are typically restricted in web contexts.

- **Backend:** Hono.js REST API with WebSocket support
- **Communication:** Client calls backend at `http://localhost:4001/api/`
- **Technology Stack:** TypeScript, Hono, WebSocket (ws), CORS

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager

### Installation
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm run dev`

### Development Commands

- `pnpm run dev` – Start the development server with auto-reload on code changes (using tsx watch)
- `pnpm run build` – Compile TypeScript to JavaScript (outputs to `dist/` folder)
- `pnpm run start` – Start the production server (expects built files in `dist/`)

## Project Structure

- `src/index.ts` – Main entry point
- `dist/` – Compiled JavaScript output directory
- `package.json` – Project dependencies and scripts
- `tsconfig.json` – TypeScript configuration

## Dependencies

### Core Dependencies
- `hono`: ^4.0.0 - Web framework for building APIs
- `ws`: ^8.14.2 - WebSocket library
- `cors`: ^2.8.5 - Cross-Origin Resource Sharing middleware
- `typescript`: ^5.2.2 - Type checking and compilation

### Development Dependencies
- `@types/node`: ^20.8.2 - TypeScript definitions for Node.js
- `@types/ws`: ^8.17.1 - TypeScript definitions for ws
- `@hono/node-server`: ^1.0.0 - Node.js server adapter for Hono
- `tsx`: ^3.12.2 - Execute TypeScript and JavaScript files
- `nodemon`: ^3.0.1 - Development utility for auto-restarting

## Code Style Guidelines

- **Syntax:** Use ES Modules (`import`/`export`) rather than CommonJS. Use modern ES6+ features (arrow functions, etc.) where appropriate.
- **Formatting:** Use 2 spaces for indentation. Use single quotes for strings. **No** trailing semicolons _(we run Prettier)_ – except where necessary in TypeScript _(enums, interfaces)_.
- **Naming:** Use `camelCase` for variables/functions, `PascalCase` for React components and classes. Constants in `UPPER_SNAKE_CASE`.
- **Patterns:** Prefer functional components with hooks over class components in React. Avoid using any deprecated APIs.

## Error Handling & Debugging

- **Diagnose, Don't Guess:** When encountering a bug or failing test, first explain possible causes step-by-step: [docs.claude.com](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought%23:~:text=,where%20prompts%20may%20be%20unclear). Check assumptions, inputs, and relevant code paths.
- **Graceful Handling:** Code should handle errors gracefully. For example, use try/catch around async calls, and return user-friendly error messages or fallback values when appropriate.
- **Logging:** Include helpful console logs or error logs for critical failures (but avoid log spam in production code).
- **No Silent Failures:** Do not swallow exceptions silently. Always surface errors either by throwing or logging them.

## Development Workflow

1. Make changes to TypeScript files in the `src/` directory
2. Run `pnpm run dev` to start the development server with hot-reload
3. For production builds, run `pnpm run build` and then `pnpm run start`
4. Follow the code style guidelines to maintain consistency
