# Frame Studio

![demo](image.png)

AI motion graphics generator using React, Remotion, TypeScript, and Google Gemini API.

Provide a text prompt and API key. Frame Studio generates a Remotion video project, compiles it, renders an MP4, and streams it to your browser for download.

## Architecture

Client provides API key via browser modal (stored in HTTP-only cookie). The app now uses a separate render worker service for compilation and rendering so the web front-end can stay lightweight and deployable to Vercel/Netlify.

Flow (split architecture):
- Web app (`apps/web`) — handles plan + codegen + API, forwards render jobs to the render worker
- Render worker (`workers/render-worker`) — compiles, renders via Remotion, returns MP4

This separation allows deploying the web app to serverless platforms (Vercel) while running the CPU/ram heavy render process on a dedicated host (Render.com, DigitalOcean, etc.).

**Pipeline:**
1. Plan: Gemini creates video structure from prompt
2. Codegen: Gemini writes React/Remotion code
3. Compile: TypeScript validation in sandbox
4. Fix: Gemini repairs compilation errors (max 3 attempts)
5. Render: Remotion renders MP4
6. Stream: Direct download to browser

Queueing and metadata:
- The render worker enqueues incoming jobs to limit concurrent renders. The worker returns HTTP headers with queue metadata that the web UI forwards to the client:
	- `X-Queue-Position` — your position in the queue (1 = first)
	- `X-Queue-First` — `true` if you are first and rendering begins
	- `X-Queue-Active` / `X-Queue-Pending` — counts for active and pending jobs

The web UI reads these headers and displays queue position / first-in-line messaging during generation.

**Tech:**
- Next.js 15 (webpack)
- Remotion 4.0 for rendering
- Google Gemini API for code generation
- No database, no storage, no background workers

## Project Structure

```
apps/web/           Next.js app with API routes and UI
packages/pipeline/  AI processing (prompts, schemas, LLM client)
packages/remotion-skeleton/  Template for video projects
workers/render-worker/  Compile and render functions

## Deployment notes (render worker)

Recommended: deploy the render worker as a Web Service (example: Render.com).

- Build command (Render):
	- `pnpm --dir workers/render-worker build`
- Start command (Render):
	- `pnpm --dir workers/render-worker start`
- Node version: use Node.js 18+ or match repo (`engines` / Render setting). The repo uses Node 24 in CI examples.

Environment variables for the worker:
- `SKELETON_DIR` — optional path to `packages/remotion-skeleton` if you vendor it separately
- `RENDER_QUEUE_CONCURRENCY` — number of concurrent renders (default: `1`)
- `RENDER_QUEUE_MAX_PENDING` — max queued jobs (default: `10`)
- `WEB_ORIGIN` — optional, set to your web app origin to restrict CORS (the worker supports CORS if enabled)
- `GEMINI_API_KEY` — optional LLM key if you want the worker to call Gemini instead of the web app

If you deploy the worker to `https://frame-studio-render-worker.onrender.com`, set the web app env var `RENDER_WORKER_URL` to that value so the Next API forwards render jobs to the worker.
```

## Setup

Install dependencies:
```bash
pnpm install
```

Optional: Create `.env` for server-side API key fallback:
```bash
cp .env.example .env
```

Add Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...
```

If not set, users provide their own key via browser modal.

Local dev with worker:

- Start worker locally:
```bash
pnpm --filter render-worker dev
```

- Point the web app to the worker by adding `apps/web/.env.local`:
```env
RENDER_WORKER_URL=http://localhost:3001
```

Cross-origin / CORS:
- If your web app and worker are on different origins (deployment), enable CORS in the worker. Example in `workers/render-worker/index.ts`:
```ts
import cors from "cors";
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "*" }));
```
Install with:
```bash
cd workers/render-worker && pnpm add cors
```

Quick verification (worker deployed):
```bash
curl -v -X POST https://frame-studio-render-worker.onrender.com/render \
	-H "Content-Type: application/json" \
	-d '{"files": {}}'
```

Or trigger from the web UI and observe `X-Queue-Position` headers in the response.

## Running

```bash
pnpm dev
```

Application runs at `http://localhost:3000`.

## Gemini API Key

Get a key from [Google AI Studio](https://aistudio.google.com/api-keys).

## Features

- Custom animated cursor (macOS-style arrow with hover states)
- Animated gradient heading
- Model selector (6 Gemini models)
- Real-time progress screen with stage updates
- Typing animation with motion blur effect
- Premium glassmorphic UI

## Notes

- Uses webpack (not Turbopack) for stability
- API key stored in HTTP-only cookies
- Videos render at 1920x1080, 30fps
- Supports 25+ Google Fonts for premium typography

## License

MIT

