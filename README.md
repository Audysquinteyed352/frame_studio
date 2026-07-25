# Frame Studio

![demo](image.png)

AI motion graphics generator using React, Remotion, TypeScript, and Google Gemini API.

Provide a text prompt. Frame Studio generates a Remotion video project, compiles it, renders an MP4 **directly in your browser**, and downloads it. No server-side rendering, no AWS, no credit card needed.

## Architecture

```
Browser                 Server (Vercel - FREE)
   │                          │
   │── prompt ──────────────► │
   │                          │── Plan (Gemini)
   │                          │── Codegen (Gemini)
   │                          │── TypeScript check + fix loop
   │                          │── Compile TSX → JS (esbuild)
   │◄── compiled code ─────── │
   │                          │
   │── renderMediaOnWeb()     │
   │── (WebCodecs + Mediabunny)
   │── download MP4           │
```

**Flow:**
1. Plan: Gemini creates video structure from prompt
2. Codegen: Gemini writes React/Remotion code
3. Compile: TypeScript validation in sandbox
4. Fix: Gemini repairs compilation errors (max 3 attempts)
5. Server compiles TSX → JS using esbuild
6. Browser evaluates the code and renders MP4 using `@remotion/web-renderer`
7. Instant download — no queue, no waiting

**Tech:**
- Next.js 15 (free Vercel deployment)
- Remotion 4.0 for video rendering (client-side via WebCodecs)
- Google Gemini API for AI code generation
- **Zero infrastructure costs** — no servers, no AWS, no credit card

## Prerequisites

- Node.js 18+
- pnpm
- Google Gemini API key

## Setup

```bash
pnpm install
pnpm dev
```

Application runs at `http://localhost:3000`.

Provide your Gemini API key in the web UI or set `GEMINI_API_KEY` env var.

## Deployment (Vercel — free)

```bash
pnpm build
```

Deploy to Vercel. Set `GEMINI_API_KEY` in Vercel environment variables. No other configuration needed — rendering happens in the user's browser.

## Browser Support

Client-side video rendering requires the [WebCodecs API](https://caniuse.com/webcodecs):
- Chrome 94+
- Firefox 130+
- Edge 94+

## Development

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm lint       # Lint
```

## Project Structure

```
apps/web/           Next.js app with API routes and UI
packages/pipeline/  AI processing (prompts, schemas, LLM client)
packages/remotion-skeleton/  Template for video projects
```

## Features

- Zero infrastructure — renders entirely in the browser
- Custom animated cursor (macOS-style arrow with hover states)
- Model selector (6 Gemini models)
- Real-time progress screen with stage updates
- Premium glassmorphic UI

## Notes

- Uses webpack (not Turbopack) for stability
- API key stored in HTTP-only cookies
- Videos render at 1920x1080, 30fps

## License

MIT
